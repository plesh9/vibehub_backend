import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [PrismaModule, UserModule],
    controllers: [AppController, UserController],
    providers: [AppService, UserService],
})
export class AppModule {}
