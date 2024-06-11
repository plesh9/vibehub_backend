import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@user/user.module';
import { jwtModuleAsyncOptions } from './config';
import { STRATEGIES } from './strategies';
import { GUARDS } from './guards';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/shemas/user.schema';
import { Token, TokenSchema } from 'src/shemas/token.schema';

@Module({
    controllers: [AuthController],
    providers: [AuthService, ...STRATEGIES, ...GUARDS],
    imports: [
        PassportModule,
        JwtModule.registerAsync(jwtModuleAsyncOptions()),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
        UserModule,
    ],
})
export class AuthModule {}
