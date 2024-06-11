// src/schemas/chat.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './user.schema';
import * as mongoose from 'mongoose';
import { Message } from './message.schema';

export type ChatDocument = Chat & Document;

@Schema({ collection: 'chats', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Chat {
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
    users: User[];

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message' })
    lastMessage: Message;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }] })
    messages: Message[];

    @Prop({ type: Date, default: Date.now })
    created_at: Date;

    @Prop({ type: Date, default: Date.now })
    updated_at: Date;
    _id: Record<string, any>;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
