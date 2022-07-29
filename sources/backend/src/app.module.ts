import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './products/products.module';
import { ChatGateway } from './chat/chat.gateway';
import { AuthModule } from './auth/auth.module';
import * as Joi from '@hapi/joi';

@Module({
  imports: [UsersModule, ConfigModule.forRoot({
    validationSchema: Joi.object({
      POSTGRES_HOST: Joi.string().required(),
      POSTGRES_PORT: Joi.number().required(),
      POSTGRES_USER: Joi.string().required(),
      POSTGRES_PASSWORD: Joi.string().required(),
      POSTGRES_DB: Joi.string().required(),
      PORT: Joi.number(),
    })
  }
  ), DatabaseModule, ProductsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
