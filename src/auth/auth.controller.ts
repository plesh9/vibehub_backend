import { AuthService } from './auth.service';
import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpStatus,
    Post,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { LoginResponse, RegisterResponse } from './interfeces';
import { Cookie, Public, UserAgent } from '@common/decorators';

const REFRESH_TOKEN = 'refreshToken';

@Public()
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {}

    @Post('register')
    async register(@Body() dto: RegisterDto, @Res() res: Response, @UserAgent() userAgent: string) {
        const user = await this.authService.register(dto, userAgent);

        if (!user) {
            throw new BadRequestException(`Could not register user with provided data ${JSON.stringify(dto)}`);
        }

        this.setRefreshTokenCookies(user, res);
    }

    @Post('login')
    async login(@Body() dto: LoginDto, @Res() res: Response, @UserAgent() userAgent: string) {
        const user = await this.authService.login(dto, userAgent);

        if (!user) {
            throw new BadRequestException(`Could not login user with provided data ${JSON.stringify(dto)}`);
        }

        this.setRefreshTokenCookies(user, res);

        return user;
    }

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

    private setRefreshTokenCookies(user: LoginResponse | RegisterResponse, res: Response) {
        if (!user.refreshToken) {
            throw new UnauthorizedException('Refresh token is not provided');
        }

        res.cookie(REFRESH_TOKEN, user.refreshToken.token, {
            httpOnly: true,
            sameSite: 'lax',
            expires: new Date(user.refreshToken.expiresAt),
            secure: this.configService.get('NODE_ENV', 'development') === 'production',
            path: '/',
        });

        res.status(HttpStatus.CREATED).json({
            accessToken: user.accessToken,
            user: user.user,
        });
    }
}
