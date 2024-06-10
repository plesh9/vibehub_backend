// src/schemas/token.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './user.schema';
import * as mongoose from 'mongoose';

export type TokenDocument = Token & Document;

@Schema({ collection: 'tokens' })
export class Token {
    @Prop({ type: String, required: true, unique: true })
    token: string;

    @Prop({ type: Date, required: true })
    expiresAt: Date;

    @Prop({ type: String, required: true })
    userAgent: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    userId: User;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
