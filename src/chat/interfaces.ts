export interface ChatType {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    lastMessage: MessageType | null;
    users: ChatUserType[];
}

export interface MessageType {
    id: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    user: ChatUserType;
    chat: {
        id: string;
        name: string;
    };
}

export interface ChatUserType {
    id: string;
    name: string;
    avatarUrl: string;
    lastOnlineAt: string;
}
