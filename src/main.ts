import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(
        cors({
            origin: process.env.FRONTEND_URL,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            preflightContinue: false,
            optionsSuccessStatus: 204,
            allowedHeaders: 'Content-Type, Accept, Authorization',
            credentials: true,
        }),
    );

    app.use(cookieParser());
    await app.listen(process.env.PORT || 4000);
}
bootstrap();
