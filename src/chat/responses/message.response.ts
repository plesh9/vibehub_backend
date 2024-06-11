import { Message } from 'src/shemas/message.schema';

export class MessageResponse {
    text: string;
    user: {
        email: string;
        name: string;
        avatarUrl: string;
        password: string;
        lastOnlineAt: string;
        id: string;
    };
    chat: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
    id: string;

    constructor(partial: Partial<Message>) {
        this.text = partial.text;
        this.user = {
            email: partial.user.email,
            name: partial.user.name,
            avatarUrl: partial.user.avatarUrl,
            password: partial.user.password,
            lastOnlineAt: partial.user.lastOnlineAt,
            id: partial.user._id.toString(),
        };
        this.chat = {
            id: partial.chat._id.toString(),
            name: partial.chat.name,
        };
        this.createdAt = partial.created_at.toISOString();
        this.updatedAt = partial.updated_at.toISOString();
        this.id = partial._id.toString();
    }
}
