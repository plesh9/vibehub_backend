import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { ChatModule } from './chat/chat.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './shemas/user.schema';
import { Token, TokenSchema } from './shemas/token.schema';
import { Chat, ChatSchema } from './shemas/chat.schema';
import { Message, MessageSchema } from './shemas/message.schema';

@Module({
    imports: [
        MongooseModule.forRoot(process.env.DATABASE_URL),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Token.name, schema: TokenSchema },
            { name: Chat.name, schema: ChatSchema },
            { name: Message.name, schema: MessageSchema },
        ]),
        UserModule,
        AuthModule,
        ChatModule,
        ConfigModule.forRoot({ isGlobal: true }),
    ],
    controllers: [AppController, UserController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {}
