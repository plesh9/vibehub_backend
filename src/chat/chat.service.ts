import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatGateway } from './chat.gateway';
import { CreateMessageDto } from './dto';
import { PaginationDto } from 'libs/types';
import { ChatType, MessageType } from './interfaces';
import { Chat, ChatDocument } from 'src/shemas/chat.schema';
import { Message, MessageDocument } from 'src/shemas/message.schema';
import { User, UserDocument } from 'src/shemas/user.schema';
import { ChatResponse, MessageResponse } from './responses';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly chatGateway: ChatGateway,
    ) {}

    async getChats(paginationDto: PaginationDto, userId: string): Promise<{ chats: ChatType[]; hasMore: boolean }> {
        const { page, limit } = new PaginationDto(paginationDto);
        const offset = (page - 1) * limit;

        const chats = await this.chatModel
            .find({ users: userId })
            .skip(offset)
            .limit(limit + 1)
            .populate('users')
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'user',
                },
            })
            .exec();

        const hasMore = chats.length > limit;
        const chatsToReturn = hasMore ? chats.slice(0, -1) : chats;

        return {
            chats: chatsToReturn
                .map((chat) => new ChatResponse(chat))
                .sort((a, b) => {
                    if (a.lastMessage && b.lastMessage) {
                        return (
                            new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
                        );
                    }
                    if (a.lastMessage) {
                        return -1;
                    }
                    if (b.lastMessage) {
                        return 1;
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }),
            hasMore,
        };
    }

    async getChatById(chatId: string): Promise<ChatType | null> {
        const chat = await this.chatModel
            .findById(chatId)
            .populate('users')
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'user',
                },
            })
            .exec();

        if (!chat) return null;

        return new ChatResponse(chat);
    }

    async getMessagesByChatId(
        chatId: string,
        paginationDto: PaginationDto,
    ): Promise<{ messages: MessageType[]; hasMore: boolean }> {
        const { page, limit } = new PaginationDto(paginationDto);
        const offset = (page - 1) * limit;

        try {
            const messages = await this.messageModel
                .find({ chat: chatId })
                .skip(offset)
                .limit(limit + 1)
                .populate('user')
                .populate('chat')
                .exec();

            const hasMore = messages.length > limit;
            const messagesToReturn = hasMore ? messages.slice(0, -1) : messages;

            return {
                messages: messagesToReturn
                    .map((message) => new MessageResponse(message))
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
                hasMore,
            };
        } catch (error) {
            console.error(`Error fetching messages for chat ${chatId}:`, error);
            return { messages: [], hasMore: false };
        }
    }

    async createMessage({ chatId, toUserId, text }: CreateMessageDto, fromUserId: string): Promise<MessageType> {
        let chat: ChatDocument;

        if (chatId) {
            chat = await this.chatModel.findById(chatId).populate('users').exec();
        }

        if (!chat) {
            chat = await this.chatModel
                .findOne({
                    users: { $all: [fromUserId, toUserId] },
                })
                .populate('users')
                .exec();
        }

        if (!chat) {
            chat = new this.chatModel({
                users: [fromUserId, toUserId],
                name: 'New Chat',
            });
            await chat.save();

            this.chatGateway.addUsersToChatRoom([fromUserId, toUserId], chat._id.toString());
        }

        const message = new this.messageModel({
            text,
            user: fromUserId,
            chat: chat._id,
        });
        await message.save();

        chat.lastMessage = message;
        await chat.save();

        const populatedMessage = await this.messageModel.findById(message._id).populate('user').populate('chat').exec();

        const messageResponse = new MessageResponse(populatedMessage);

        this.chatGateway.sendMessageToChat(chat._id.toString(), messageResponse, fromUserId);

        return messageResponse;
    }
}
