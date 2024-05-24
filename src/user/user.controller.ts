import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        return this.userService.save(createUserDto);
    }

    @Get(':idOrEmail')
    async findOneUser(@Param('idOrEmail') id: string) {
        return this.userService.findOne(id);
    }

    @Delete(':id')
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.userService.delete(id);
    }
}
