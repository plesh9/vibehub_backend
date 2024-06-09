import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { UserModule } from '@user/user.module';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from '@prisma/prisma.service';

@Module({
    controllers: [ChatController],
    providers: [ChatGateway, ChatService, PrismaService],
    exports: [ChatService],
    imports: [UserModule],
})
export class ChatModule {}
