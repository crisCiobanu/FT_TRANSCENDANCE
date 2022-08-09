import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import User from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { Channel } from './channel.entity';
import { IChannel } from './channel.interface';
import { Socket } from 'socket.io';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ChannelService {
    constructor(
        @InjectRepository(Channel)
        private readonly channelRepository: Repository<Channel>,
        private readonly authService: AuthService
    ){}

    async createChannel(channel : IChannel, owner: User): Promise<Channel>{
        const tempChannel = await this.addOwnerToChannel(channel, owner);
        if (!channel.isPublic){
            channel.password = await bcrypt.hash(channel.password, 5);         
        }
        return this.channelRepository.save(tempChannel);
    }

    async addOwnerToChannel(channel: IChannel, owner: User): Promise<IChannel>{
        console.log(owner);
        channel.channelOwnerId = owner.id;
        channel.users = [owner];
        return channel;
    }

    async getChannelsByUserId(userId: number): Promise<Channel[]>{
        const query = this.channelRepository.createQueryBuilder('channel')
        .leftJoin('channel.users', 'users')
        .where('users.id = :userId', { userId });

        console.log("LOG FROM GET CHANNEL BY USER ID");

        const channels = await query.getMany();
        console.log(channels);
        return channels;
    }


    // async getAllChannels(): Promise<Channel[]>{
    //     return this.channelRepository.findBy({isDirectMessage : false})
    // }


    async getAllChannels(): Promise<Channel[]>{
        return this.channelRepository.createQueryBuilder('channel')
        .leftJoinAndSelect('channel.users', 'users')
        .getMany();
    }

    // async getDirectMessageChannels(id: number): Promise<Channel[]>{
    //     return this.channelRepository.findBy({id, isDirectMessage: true})
    // }

    async getDirectMessageChannels(userId: number): Promise<Channel[]>{
        return this.channelRepository.createQueryBuilder('channel')
        .leftJoinAndSelect('channel.users', 'users')
        .where('users.id = :userId', { userId })
        .andWhere('channel.isDirectMessage = true')
        .getMany();
    }


    async deleteAllChannels(){
        await this.channelRepository.clear();
    }

    printChannels(channels : Channel[]){
        console.log("Users channels are : ");
        console.log(channels);
    }






}
