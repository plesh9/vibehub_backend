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
import { PaginationDto } from 'libs/types';
import { CurrentUser } from '@common/decorators';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @UseInterceptors(ClassSerializerInterceptor)
    @Get()
    async findAll(@CurrentUser() jwtUser: JwtPayload, @Query() paginationDto: PaginationDto) {
        const currentUser = await this.userService.findById(jwtUser.id);

        if (!currentUser) {
            throw new UnauthorizedException('User not found');
        }

        const usersData = await this.userService.findAll(paginationDto);

        return {
            users: usersData.users
                .map((user) => new UserResponse(user))
                .filter((user) => user.id !== currentUser._id.toString()),
            hasMore: usersData.hasMore,
        };
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        const user = await this.userService.save(createUserDto);

        return new UserResponse(user);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Get(':idOrEmail')
    async findOneUser(@Param('idOrEmail') id: string) {
        const user = await this.userService.findById(id);

        return new UserResponse(user);
    }

    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.userService.delete(id);
    }
}
