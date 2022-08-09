import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { Socket } from 'socket.io'
import { IMessage } from './message.interface';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>
    ){}

    async createMessage(msg: IMessage): Promise<Message>{
        return this.messageRepository.create(msg);
    }
}
