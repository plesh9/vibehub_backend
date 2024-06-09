import { JwtPayload } from './../auth/interfeces';
import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    UnauthorizedException,
    UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto';
import { UserResponse } from './responses';
import { plainToClass } from 'class-transformer';
import { PaginationDto } from 'libs/types';
import { CurrentUser } from '@common/decorators';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @UseInterceptors(ClassSerializerInterceptor)
    @Get()
    async findAll(@CurrentUser() jwtUser: JwtPayload, @Query() paginationDto: PaginationDto) {
        const currentUser = await this.userService.findOne(jwtUser.id);

        if (!currentUser) {
            throw new UnauthorizedException('User not found');
        }

        const pageNumber = Number(paginationDto.page) || 1;
        const limitNumber = Number(paginationDto.limit) || 52;

        const usersData = await this.userService.findAll(pageNumber, limitNumber);

        return {
            users: usersData.users
                .map((user) => plainToClass(UserResponse, user))
                .filter((user) => user.id !== currentUser.id),
            hasMore: usersData.hasMore,
        };
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        const user = await this.userService.save(createUserDto);

        return plainToClass(UserResponse, user);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Get(':idOrEmail')
    async findOneUser(@Param('idOrEmail') id: string) {
        const user = await this.userService.findOne(id);

        return plainToClass(UserResponse, user);
    }

    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.userService.delete(id);
    }
}
