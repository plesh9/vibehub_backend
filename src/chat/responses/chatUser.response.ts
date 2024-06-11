import { User } from 'src/shemas/user.schema';

export class ChatUserResponse {
    id: string;
    name: string;
    avatarUrl: string;
    lastOnlineAt: string;

    constructor(partial: Partial<User>) {
        this.id = partial._id.toString();
        this.name = partial.name;
        this.avatarUrl = partial.avatarUrl;
        this.lastOnlineAt = partial.lastOnlineAt;
    }
}
