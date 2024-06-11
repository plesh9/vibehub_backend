import { Chat } from 'src/shemas/chat.schema';
import { ChatUserType, MessageType } from '../interfaces';
import { MessageResponse } from './message.response';
import { ChatUserResponse } from './chatUser.response';

export class ChatResponse {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    lastMessage: MessageType | null;
    users: ChatUserType[];

    constructor(partial: Partial<Chat>) {
        this.id = partial._id.toString();
        this.name = partial.name;
        this.createdAt = partial.created_at.toISOString();
        this.updatedAt = partial.updated_at.toISOString();
        this.lastMessage = partial.lastMessage ? new MessageResponse(partial.lastMessage) : null;
        this.users = partial.users.map((user) => new ChatUserResponse(user));
    }
}
