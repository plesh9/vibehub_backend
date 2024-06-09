import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ChatType, MessageType } from './interfaces';
import { PaginationDto } from 'libs/types';
import { CreateMessageDto } from './dto';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly chatGateway: ChatGateway,
    ) {}

    async getChats(paginationDto: PaginationDto, userId: string): Promise<{ chats: ChatType[]; hasMore: boolean }> {
        const { page, limit } = paginationDto;
        const offset = (page - 1) * limit;

        const chats = await this.prismaService.chat.findMany({
            where: {
                users: {
                    some: {
                        id: userId,
                    },
                },
            },
            skip: offset,
            take: +limit + 1, // Fetch one extra item to check if there's more
            include: {
                users: true,
                lastMessage: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        const hasMore = chats.length > limit;
        const chatsToReturn = hasMore ? chats.slice(0, -1) : chats;

        return {
            chats: chatsToReturn
                .map((chat) => ({
                    id: chat.id,
                    name: chat.name,
                    createdAt: chat.createdAt,
                    updatedAt: chat.updatedAt,
                    lastMessage: chat.lastMessage
                        ? {
                              id: chat.lastMessage.id,
                              text: chat.lastMessage.text,
                              createdAt: chat.lastMessage.createdAt,
                              updatedAt: chat.lastMessage.updatedAt,
                              user: {
                                  id: chat.lastMessage.user.id,
                                  name: chat.lastMessage.user.name,
                                  avatarUrl: chat.lastMessage.user.avatarUrl,
                                  lastOnlineAt: chat.lastMessage.user.lastOnlineAt,
                              },
                              chat: {
                                  id: chat.id,
                                  name: chat.name,
                              },
                          }
                        : null,
                    users: chat.users.map((user) => ({
                        id: user.id,
                        name: user.name,
                        avatarUrl: user.avatarUrl,
                        lastOnlineAt: user.lastOnlineAt,
                    })),
                }))
                .sort((a, b) => {
                    if (a.lastMessage && b.lastMessage) {
                        return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
                    }
                    if (a.lastMessage) {
                        return -1;
                    }
                    if (b.lastMessage) {
                        return 1;
                    }
                    return b.createdAt.getTime() - a.createdAt.getTime();
                }),
            hasMore,
        };
    }

    async getChatById(chatId: string): Promise<ChatType | null> {
        const chat = await this.prismaService.chat.findUnique({
            where: { id: chatId },
            include: {
                users: true,
                lastMessage: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!chat) return null;

        return {
            id: chat.id,
            name: chat.name,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            lastMessage: chat.lastMessage
                ? {
                      id: chat.lastMessage.id,
                      text: chat.lastMessage.text,
                      createdAt: chat.lastMessage.createdAt,
                      updatedAt: chat.lastMessage.updatedAt,
                      user: {
                          id: chat.lastMessage.user.id,
                          name: chat.lastMessage.user.name,
                          avatarUrl: chat.lastMessage.user.avatarUrl,
                          lastOnlineAt: chat.lastMessage.user.lastOnlineAt,
                      },
                      chat: {
                          id: chat.id,
                          name: chat.name,
                      },
                  }
                : null,
            users: chat.users.map((user) => ({
                id: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl,
                lastOnlineAt: user.lastOnlineAt,
            })),
        };
    }

    async getMessagesByChatId(
        chatId: string,
        paginationDto: PaginationDto,
    ): Promise<{ messages: MessageType[]; hasMore: boolean }> {
        const { page, limit } = paginationDto;
        const offset = (page - 1) * limit;

        const messages = await this.prismaService.message.findMany({
            where: { chatId },
            skip: offset,
            take: +limit + 1, // Fetch one extra item to check if there's more
            include: {
                user: true,
                chat: true,
            },
        });

        const hasMore = messages.length > limit;
        const messagesToReturn = hasMore ? messages.slice(0, -1) : messages;

        return {
            messages: messagesToReturn
                .map((message) => ({
                    id: message.id,
                    text: message.text,
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt,
                    user: {
                        id: message.user.id,
                        name: message.user.name,
                        avatarUrl: message.user.avatarUrl,
                        lastOnlineAt: message.user.lastOnlineAt,
                    },
                    chat: {
                        id: message.chat.id,
                        name: message.chat.name,
                    },
                }))
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
            hasMore,
        };
    }

    async createMessage({ chatId, toUserId, text }: CreateMessageDto, fromUserId: string): Promise<MessageType> {
        let chat;

        if (chatId) {
            // Search by chatId
            chat = await this.prismaService.chat
                .findUnique({
                    where: { id: chatId },
                    include: {
                        users: true,
                    },
                })
                .catch(() => null);
        }

        if (!chat) {
            chat = await this.prismaService.chat
                .findFirst({
                    where: {
                        AND: [{ users: { some: { id: fromUserId } } }, { users: { some: { id: toUserId } } }],
                    },
                    include: {
                        users: true,
                    },
                })
                .catch(() => null);
        }

        if (!chat) {
            // Create a new chat if no chat is found
            chat = await this.prismaService.chat.create({
                data: {
                    users: {
                        connect: [{ id: fromUserId }, { id: toUserId }],
                    },
                    name: 'New Chat',
                },
                include: {
                    users: true,
                },
            });

            this.chatGateway.addUsersToChatRoom([fromUserId, toUserId], chat.id);
        }

        const message = await this.prismaService.message.create({
            data: {
                text,
                userId: fromUserId,
                chatId: chat.id,
            },
            include: {
                user: true,
                chat: true,
            },
        });

        await this.prismaService.chat.update({
            where: { id: chat.id },
            data: {
                lastMessage: {
                    connect: { id: message.id },
                },
            },
        });

        this.chatGateway.sendMessageToChat(chat.id, message, fromUserId);

        return {
            id: message.id,
            text: message.text,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            user: {
                id: message.user.id,
                name: message.user.name,
                avatarUrl: message.user.avatarUrl,
                lastOnlineAt: message.user.lastOnlineAt,
            },
            chat: {
                id: message.chat.id,
                name: message.chat.name,
            },
        };
    }
}
