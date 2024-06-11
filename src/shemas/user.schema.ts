// src/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Chat } from './chat.schema';
import { Token } from './token.schema';
import { Message } from './message.schema';

export type UserDocument = User & Document;

@Schema({ collection: 'users', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
    @Prop({ type: String, required: true, unique: true })
    email: string;

    @Prop({ type: String })
    name?: string;

    @Prop({ type: String })
    avatarUrl?: string;

    @Prop({ type: String, required: true })
    password: string;

    @Prop({ type: String })
    lastOnlineAt?: string;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }] })
    chats: Chat[];

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }] })
    messages: Message[];

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Token' }] })
    tokens: Token[];
    _id: Record<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User);
