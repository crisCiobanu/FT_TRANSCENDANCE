import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import User from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { Channel } from './channel.entity';
import { IChannel } from './channel.interface';

@Injectable()
export class ChannelService {
    constructor(
        @InjectRepository(Channel)
        private readonly channelRepository: Repository<Channel>
    ){}

    async createChannel(channel : IChannel, owner: User): Promise<Channel>{
        const tempChannel = await this.addOwnerToChannel(channel, owner);
        return this.channelRepository.save(tempChannel);
    }

    async getChannelsByUserId(userId: number): Promise<Channel[]>{
        const query = this.channelRepository.createQueryBuilder('channel')
        .leftJoin('channel.users', 'users')
        .where('users.id = :userid', { userId })
        .leftJoinAndSelect('room.users', 'all_users')
        .orderBy('room.updated_at', 'DESC');

        const channels: Channel[] = await query.getMany();
        return channels;


    }



    async addOwnerToChannel(channel: IChannel, owner: User): Promise<IChannel>{
        channel.channelOwnerId = owner.id;
        channel.users.push(owner);
        return channel;
    }


}
