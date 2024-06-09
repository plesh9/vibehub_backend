import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '@prisma/prisma.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private onlineUsers: Set<string> = new Set();
    private userSocketMap: Map<string, string> = new Map();

    constructor(private readonly prismaService: PrismaService) {}

    async handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.onlineUsers.add(userId);
            this.userSocketMap.set(userId, client.id);
            await this.prismaService.user
                .update({
                    where: { id: userId },
                    data: { lastOnlineAt: 'ONLINE' },
                })
                .catch(() => null);
            client.join(userId);
            console.log(`User ${userId} connected`);
            await this.addUserToChats(userId, client);
            this.updateOnlineUsers();
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.onlineUsers.delete(userId);
            this.userSocketMap.delete(userId);
            await this.prismaService.user.update({
                where: { id: userId },
                data: { lastOnlineAt: new Date().toISOString() },
            });
            client.leave(userId);
            console.log(`User ${userId} disconnected`);
            this.server.emit('userDisconnected', userId);
            this.updateOnlineUsers();
        }
    }

    async addUserToChats(userId: string, client: Socket) {
        const userChats = await this.prismaService.chat.findMany({
            where: {
                users: {
                    some: {
                        id: userId,
                    },
                },
            },
        });

        userChats.forEach((chat) => {
            client.join(chat.id);
        });
        console.log(`User ${userId} joined ${userChats.length} chats`);
    }

    async addUsersToChatRoom(userIds: string[], chatId: string) {
        userIds.forEach((userId) => {
            const clientId = this.userSocketMap.get(userId);
            if (clientId) {
                const client = this.server.sockets.sockets.get(clientId);
                if (client) {
                    client.join(chatId);
                    console.log(`User ${userId} joined chat ${chatId}`);
                }
            }
        });
    }

    sendMessageToChat(chatId: string, message: any, senderId: string) {
        this.server.to(chatId).except(senderId).emit('receiveMessage', message);
    }

    private async updateOnlineUsers() {
        const onlineUsersArray = Array.from(this.onlineUsers);

        this.server.emit('onlineUsers', onlineUsersArray);
    }
}
