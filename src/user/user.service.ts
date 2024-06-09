import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { genSaltSync, hashSync } from 'bcrypt';

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) {}

    save(user: Partial<User>) {
        const hashedPassword = this.hashPassword(user.password);

        return this.prismaService.user.create({
            data: {
                ...user,
                email: user.email,
                password: hashedPassword,
            },
        });
    }

    findOne(idOrEmail: string) {
        return this.prismaService.user.findFirst({
            where: {
                OR: [{ id: idOrEmail }, { email: idOrEmail }],
            },
        });
    }

    async findAll(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [users, totalUsers] = await Promise.all([
            this.prismaService.user.findMany({
                skip,
                take: limit,
            }),
            this.prismaService.user.count(),
        ]);

        const hasMore = skip + users.length < totalUsers;

        return { users, hasMore };
    }

    delete(id: string) {
        return this.prismaService.user.delete({
            where: { id },
            select: { id: true },
        });
    }

    private hashPassword(password: string) {
        return hashSync(password, genSaltSync(10));
    }
}
