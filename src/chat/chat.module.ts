import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { UserModule } from '@user/user.module';
import { ChatGateway } from './chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/shemas/user.schema';
import { Message, MessageSchema } from 'src/shemas/message.schema';
import { Chat, ChatSchema } from 'src/shemas/chat.schema';

@Module({
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
    exports: [ChatService],
    imports: [
        MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
        MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        UserModule,
    ],
})
export class ChatModule {}
