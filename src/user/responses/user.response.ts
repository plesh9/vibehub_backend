import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserResponse implements User {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
    createdAt: Date;
    updatedAt: Date;
    lastOnlineAt: Date;

    @Exclude()
    password: string;

    constructor(user: User) {
        Object.assign(this, user);
    }
}
