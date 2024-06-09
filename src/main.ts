import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    });

    app.use(cookieParser());
    await app.listen(process.env.PORT || 4000);
}
bootstrap();
