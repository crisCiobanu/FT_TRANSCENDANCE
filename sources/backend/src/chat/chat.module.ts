import { forwardRef, Module } from '@nestjs/common';
import { MessageService } from './message/message.service';
import { ChannelService } from './channel/channel.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './channel/channel.entity';
import { Message } from './message/message.entity';
import User from 'src/users/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { PongModule } from '../pong/pong.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { UsersModule } from 'src/users/users.module';
import { ConnectionService } from './connection/connection.service';
import { Connection } from './connection/connection.entity';
import { PunisheduserService } from './punisheduser/punisheduser.service';
import { PunishedUser } from './punisheduser/punisheduser.entity';

@Module({
  providers: [MessageService, ChannelService, ChatGateway, ChatService, ConnectionService, PunisheduserService],
  imports: [ AuthModule,
              forwardRef(() => PongModule),
              forwardRef(() => UsersModule),
              TypeOrmModule.forFeature([Channel, User, Message, Connection, PunishedUser])],
  controllers: [ChatController]
})
export class ChatModule {}
