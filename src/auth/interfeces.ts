import { Token, User } from '@prisma/client';

export interface Tokens {
    accessToken: string;
    refreshToken: Token;
}

export interface LoginResponse extends Tokens {
    user: User;
}

export interface RegisterResponse extends Tokens {
    user: User;
}

export interface JwtPayload {
    id: string;
    email: string;
}
