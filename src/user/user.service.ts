import { PaginationDto } from 'libs/types';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { genSaltSync, hashSync } from 'bcrypt';
import { User, UserDocument } from 'src/shemas/user.schema';

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

    async save(user: Partial<User>) {
        const hashedPassword = this.hashPassword(user.password);
        const newUser = new this.userModel({
            ...user,
            password: hashedPassword,
        });
        return newUser.save();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async findAll(paginationDto: PaginationDto) {
        const { page, limit } = new PaginationDto(paginationDto);
        const skip = (page - 1) * limit;
        const users = await this.userModel.find().skip(skip).limit(limit).exec();
        const totalUsers = await this.userModel.countDocuments().exec();
        const hasMore = skip + users.length < totalUsers;

        return { users, hasMore };
    }

    async delete(id: string) {
        return this.userModel.findByIdAndDelete(id).exec();
    }

    private hashPassword(password: string) {
        return hashSync(password, genSaltSync(10));
    }
}
