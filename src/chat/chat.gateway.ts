import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/shemas/user.schema';
import { Chat, ChatDocument } from 'src/shemas/chat.schema';
import { MessageType } from './interfaces';

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

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    ) {}

    async handleConnection(client: Socket) {
        const userId = client.handshake.query.userId.toString();

        console.log(`User ${userId} connected`);

        if (userId) {
            this.onlineUsers.add(userId);
            this.userSocketMap.set(userId, client.id);
            await this.userModel.findByIdAndUpdate(userId, { lastOnlineAt: 'ONLINE' }).catch(() => null);
            client.join(userId);
            console.log(`User ${userId} connected`);
            await this.addUserToChats(userId, client);
            this.updateOnlineUsers();
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = client.handshake.query.userId.toString();
        if (userId) {
            this.onlineUsers.delete(userId);
            this.userSocketMap.delete(userId);
            await this.userModel.findByIdAndUpdate(userId, { lastOnlineAt: new Date().toISOString() });
            client.leave(userId);
            console.log(`User ${userId} disconnected`);
            this.server.emit('userDisconnected', userId);
            this.updateOnlineUsers();
        }
    }

    async addUserToChats(userId: string, client: Socket) {
        const userChats = await this.chatModel.find({ users: userId }).exec();

        console.log(`chats`, userChats, userId);

        userChats.forEach((chat) => {
            client.join(chat._id.toString());
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

    sendMessageToChat(chatId: string, message: MessageType, senderId: string) {
        this.server.to(chatId).except(senderId).emit('receiveMessage', message);
    }

    private async updateOnlineUsers() {
        const onlineUsersArray = Array.from(this.onlineUsers);
        this.server.emit('onlineUsers', onlineUsersArray);
    }
}
