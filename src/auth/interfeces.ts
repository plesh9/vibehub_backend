import { TokenDocument } from 'src/shemas/token.schema';
import { User } from 'src/shemas/user.schema';

export interface Tokens {
    accessToken: string;
    refreshToken: TokenDocument;
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
