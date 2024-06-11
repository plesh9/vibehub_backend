// src/schemas/message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './user.schema';
import { Chat } from './chat.schema';
import * as mongoose from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ collection: 'messages', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Message {
    @Prop({ type: String, required: true })
    text: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    user: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true })
    chat: Chat;

    @Prop({ type: Date, default: Date.now })
    created_at: Date;

    @Prop({ type: Date, default: Date.now })
    updated_at: Date;
    _id: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
