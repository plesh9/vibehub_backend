import { PrismaService } from './../prisma/prisma.service';
import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import { UserService } from '@user/user.service';
import { LoginResponse, RegisterResponse, Tokens } from './interfeces';
import { compareSync } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Token, User } from '@prisma/client';
import { v4 } from 'uuid';
import { add } from 'date-fns';

@Injectable()
export class AuthService {
    private logger = new Logger(AuthService.name);
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
    ) {}

    async register(dto: RegisterDto, userAgent: string): Promise<RegisterResponse> {
        const user = await this.userService.findOne(dto.email).catch((err) => {
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
        const user = await this.userService.findOne(dto.email).catch((err) => {
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
        const token = await this.prismaService.token
            .findUnique({
                where: {
                    token: refreshToken,
                },
            })
            .catch((err) => {
                this.logger.error(err);
                return null;
            });

        if (!token) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        await this.prismaService.token.delete({ where: { token } }).catch((err) => {
            this.logger.error(err);
            return null;
        });

        if (new Date(token.expiresAt) < new Date()) {
            throw new UnauthorizedException('Refresh token expired');
        }

        const user = await this.userService.findOne(token.userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const tokens = await this.generateTokens(user, userAgent);

        return { user, ...tokens };
    }

    private async generateTokens(user: User, userAgent: string): Promise<Tokens> {
        const accessToken = 'Bearer ' + this.jwtService.sign({ id: user.id, email: user.email });
        const refreshToken = await this.getRefreshToken(user.id, userAgent);

        return { accessToken, refreshToken };
    }

    private async getRefreshToken(userId: string, userAgent: string): Promise<Token> {
        const token = await this.prismaService.token.findFirst({ where: { userId, userAgent } }).catch((err) => {
            this.logger.error(err);
            return null;
        });

        return this.prismaService.token.upsert({
            where: { token: token?.token ?? '' },
            update: {
                token: v4(),
                expiresAt: add(new Date(), { months: 1 }),
            },
            create: {
                token: v4(),
                userId,
                expiresAt: add(new Date(), { months: 1 }),
                userAgent,
            },
        });
    }
}
