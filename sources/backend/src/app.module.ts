import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ChatGateway } from './chat/chat.gateway';
import { AuthModule } from './auth/auth.module';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer'
import { ChatModule } from './chat/chat.module';
import * as Joi from '@hapi/joi';
import { ChannelService } from './chat/channel/channel.service';
import { PongGateway } from './pong/pong.gateway';
import { PongModule } from './pong/pong.module';
import { OnlineModule } from './online/online.module';
import { JoinAttribute } from 'typeorm/query-builder/JoinAttribute';

@Module({
  imports: [UsersModule, 
    ConfigModule.forRoot({
    validationSchema: Joi.object({
      POSTGRES_HOST: Joi.string().required(),
      POSTGRES_PORT: Joi.number().required(),
      POSTGRES_USER: Joi.string().required(),
      POSTGRES_PASSWORD: Joi.string().required(),
      POSTGRES_DB: Joi.string().required(),
      PORT: Joi.number(),
      BACKEND_URL: Joi.string().required(),
      FRONTEND_URL: Joi.string().required(),
      JWT_ACCESS_SECRET: Joi.string().required(),
      JWT_EXPIRATION: Joi.string().required(),
      EMAIL_ADRESS: Joi.string().email().required(),
      EMAIL_USER: Joi.string().required(),
      EMAIL_PASS: Joi.string().required(),
    }),
  }
  ), 
  MailerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      transport: {
        host: 'smtp.zoho.eu',
        port: 465,
        secure: true,
        auth: {
          user: configService.get('EMAIL_USER'),
          pass: configService.get('EMAIL_PASS')
        }
      }
    }),
  }),
  DatabaseModule, AuthModule, ChatModule, PongModule, OnlineModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
