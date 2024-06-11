import { User } from 'src/shemas/user.schema';

export class UserResponse extends User {
    email: string;
    name?: string;
    avatarUrl?: string;
    password: string;
    lastOnlineAt?: string;
    id: string;

    constructor(partial: Partial<UserResponse>) {
        super();
        this.email = partial.email;
        this.name = partial.name;
        this.avatarUrl = partial.avatarUrl;
        this.password = partial.password;
        this.lastOnlineAt = partial.lastOnlineAt;
        this.id = partial._id.toString();
    }
}
