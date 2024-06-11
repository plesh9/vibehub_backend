import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import { UserService } from '@user/user.service';
import { compareSync } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';
import { add } from 'date-fns';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginResponse, RegisterResponse, Tokens } from './interfeces';
import { Token, TokenDocument } from 'src/shemas/token.schema';
import { User, UserDocument } from 'src/shemas/user.schema';

@Injectable()
export class AuthService {
    private logger = new Logger(AuthService.name);

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    ) {}

    async register(dto: RegisterDto, userAgent: string): Promise<RegisterResponse> {
        const user = await this.userService.findByEmail(dto.email).catch((err) => {
            this.logger.error(err);
            return null;
        });

        if (user) {
            throw new ConflictException('User already exists');
        }

        const newUser = await this.userService.save(dto).catch((err) => {
            this.logger.error(err);
            return null;
        });

        const tokens = await this.generateTokens(newUser, userAgent);

        return {
            user: newUser,
            ...tokens,
        };
    }

    async login(dto: LoginDto, userAgent: string): Promise<LoginResponse> {
        const user = await this.userService.findByEmail(dto.email).catch((err) => {
            this.logger.error(err);
            return null;
        });

        if (!user || !compareSync(dto.password, user.password)) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.generateTokens(user, userAgent);

        return { user, ...tokens };
    }

    async refresh(refreshToken: string, userAgent: string): Promise<LoginResponse> {
        const token = await this.tokenModel.findOne({ token: refreshToken }).catch((err) => {
            this.logger.error(err);
            return null;
        });

        if (!token) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (new Date(token.expiresAt) < new Date()) {
            throw new UnauthorizedException('Refresh token expired');
        }

        await token.deleteOne().catch((err) => {
            this.logger.error(err);
            return null;
        });

        const user = await this.userService.findById(token.userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const tokens = await this.generateTokens(user, userAgent);

        return { user, ...tokens };
    }

    deleteRefreshToken(token: string) {
        return this.tokenModel.deleteOne({ token }).catch((err) => {
            this.logger.error(err);
            return null;
        });
    }

    async generateTokens(user: UserDocument, userAgent: string): Promise<Tokens> {
        const accessToken = this.jwtService.sign({ id: user._id, email: user.email });
        const refreshToken = await this.getRefreshToken(`${user._id}`, userAgent);

        return { accessToken, refreshToken };
    }

    private async getRefreshToken(userId: string, userAgent: string): Promise<TokenDocument> {
        const token = await this.tokenModel.findOne({ userId, userAgent }).catch((err) => {
            this.logger.error(err);
            return null;
        });

        if (token) {
            token.token = v4();
            token.expiresAt = add(new Date(), { months: 1 });
            await token.save();
            return token;
        }

        const newToken = new this.tokenModel({
            token: v4(),
            userId,
            userAgent,
            expiresAt: add(new Date(), { months: 1 }),
        });

        await newToken.save();

        return newToken;
    }
}
