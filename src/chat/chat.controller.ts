import { Body, Controller, Get, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatType, MessageType } from './interfaces';
import { JwtPayload } from '@auth/interfeces';
import { CurrentUser } from '@common/decorators';
import { UserService } from '@user/user.service';
import { CreateMessageDto } from './dto';
import { PaginationDto } from 'libs/types';

@Controller('chats')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly userService: UserService,
    ) {}

    @Get()
    async getChats(
        @Query() paginationDto: PaginationDto,
        @CurrentUser() jwtUser: JwtPayload,
    ): Promise<{
        chats: ChatType[];
        hasMore: boolean;
    }> {
        const user = await this.userService.findById(jwtUser.id);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return this.chatService.getChats(paginationDto, user.id);
    }

    @Get(':chatId')
    async getChatById(@Param('chatId') chatId: string): Promise<ChatType | null> {
        return this.chatService.getChatById(chatId);
    }

    @Get(':chatId/messages')
    async getMessages(
        @Param('chatId') chatId: string,
        @Query() paginationDto: PaginationDto,
    ): Promise<{
        messages: MessageType[];
        hasMore: boolean;
    }> {
        return await this.chatService.getMessagesByChatId(chatId, paginationDto);
    }

    @Post('/messages')
    async sendMessage(@CurrentUser() jwtUser: JwtPayload, @Body() createMessageDto: CreateMessageDto) {
        const user = await this.userService.findById(jwtUser.id);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return await this.chatService.createMessage(createMessageDto, user.id);
    }
}
