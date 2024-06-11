import { AuthService } from './auth.service';
import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpStatus,
    Post,
    Res,
    UnauthorizedException,
    UseInterceptors,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { JwtPayload, LoginResponse, RegisterResponse } from './interfeces';
import { Cookie, CurrentUser, Public, UserAgent } from '@common/decorators';
import { UserResponse } from '@user/responses';
import { UserService } from '@user/user.service';

const REFRESH_TOKEN = 'refreshToken';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly userService: UserService,
    ) {}

    @Public()
    @Post('register')
    async register(@Body() dto: RegisterDto, @Res() res: Response, @UserAgent() userAgent: string) {
        const user = await this.authService.register(dto, userAgent);

        if (!user) {
            throw new BadRequestException(`Could not register user with provided data ${JSON.stringify(dto)}`);
        }

        this.setRefreshTokenCookies(user, res);
    }

    @Public()
    @Post('login')
    async login(@Body() dto: LoginDto, @Res() res: Response, @UserAgent() userAgent: string) {
        const user = await this.authService.login(dto, userAgent);

        if (!user) {
            throw new BadRequestException(`Could not login user with provided data ${JSON.stringify(dto)}`);
        }

        this.setRefreshTokenCookies(user, res);

        return user;
    }

    @Public()
    @Get('logout')
    async logout(@Cookie(REFRESH_TOKEN) refreshToken: string, @Res() res: Response) {
        if (!refreshToken) {
            res.status(HttpStatus.OK).send();
            return;
        }

        await this.authService.deleteRefreshToken(refreshToken);

        res.cookie(REFRESH_TOKEN, '', {
            httpOnly: true,
            expires: new Date(0),
            secure: true,
        });

        res.status(HttpStatus.OK).send();
    }

    @Public()
    @Get('refresh')
    async refresh(@Cookie(REFRESH_TOKEN) refreshToken: string, @Res() res: Response, @UserAgent() userAgent: string) {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token is not provided');
        }

        const user = await this.authService.refresh(refreshToken, userAgent);

        if (!user) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        this.setRefreshTokenCookies(user, res);
    }

    @Get('me')
    async me(@CurrentUser() jwtUser: JwtPayload, @Res() res: Response, @UserAgent() userAgent: string) {
        const user = await this.userService.findById(jwtUser.id);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const tokens = await this.authService.generateTokens(user, userAgent);

        this.setRefreshTokenCookies({ user, ...tokens }, res);
    }

    private setRefreshTokenCookies(user: LoginResponse | RegisterResponse, res: Response) {
        if (!user.refreshToken) {
            throw new UnauthorizedException('Refresh token is not provided');
        }

        console.log(user);

        res.cookie(REFRESH_TOKEN, user.refreshToken.token, {
            httpOnly: true,
            sameSite: 'lax',
            expires: new Date(user.refreshToken.expiresAt),
            secure: this.configService.get('NODE_ENV', 'development') === 'production',
            path: '/',
        });

        res.status(HttpStatus.CREATED).json({
            accessToken: user.accessToken,
            user: new UserResponse(user.user),
        });
    }
}
