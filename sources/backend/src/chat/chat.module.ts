import { Module } from '@nestjs/common';
import { MessageService } from './message/message.service';
import { ChannelService } from './channel/channel.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './channel/channel.entity';
import { Message } from './message/message.entity';
import User from 'src/users/user.entity';

@Module({
  providers: [MessageService, ChannelService, ChatGateway],
  imports: [ TypeOrmModule.forFeature([Channel, User, Message])]
})
export class ChatModule {}
