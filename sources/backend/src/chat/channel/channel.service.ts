import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import User from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { Channel } from './channel.entity';
import { IChannel } from './channel.interface';
import { Socket } from 'socket.io';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ChannelService {
    constructor(
        @InjectRepository(Channel)
        private readonly channelRepository: Repository<Channel>,
        private readonly authService: AuthService,
        private readonly jwtService: JwtService
    ){}



    async createChannel(channel : any, owner: User): Promise<Channel>{
        console.log(channel);
        

        const findChannel = await this.getChannelByName(channel.name);
        if (findChannel)
            return null;
            
        const tempChannel = await this.addOwnerToChannel(channel, owner);
        tempChannel.isPublic = channel.isPublic === 'true';

        if (tempChannel.isPublic == false)
            tempChannel.password = await bcrypt.hash(channel.password, 5); 
              
        return this.channelRepository.save(tempChannel);
    }


    async joinChannel(channel : IChannel, newUser: User): Promise<Channel>{
        const tempChannel = await this.getChannelByName(channel.name);
        if (!tempChannel)
            return null;
        
        if (!tempChannel.isPublic){
            let accepted = false;
            if (channel.password)
                accepted = await bcrypt.compare(channel.password, tempChannel.password);
            if (!accepted)
                throw new WsException('Room password incorrect')
        }
        tempChannel.users.push(newUser);
        return this.channelRepository.save(tempChannel); 
    }

    async leaveChannel(channel : IChannel, userToLeave: User): Promise<Channel>{
        const tempChannel = await this.getChannelByName(channel.name);
        if (!tempChannel)
            return null;
        tempChannel.users = tempChannel.users.filter((u) => u.userName42 === userToLeave.userName42);
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
        .leftJoinAndSelect('channel.users', 'users')
        .where('users.id = :userId', { userId });
        const channels: Channel[] = await query.getMany();
        return channels;
    }

    async getChannelByName(name: string): Promise<Channel>{
        const query = this.channelRepository.createQueryBuilder('channel')
        .leftJoinAndSelect('channel.users', 'users')
        .where('channel.name = :name', { name });
        const channels: Channel = await query.getOne();
        return channels;
    }


    

    // async getAllChannels(): Promise<Channel[]>{
    //     return this.channelRepository.findBy({isDirectMessage : false})
    // }


    async getAllChannels(userId: number): Promise<Channel[]>{
        return this.channelRepository.createQueryBuilder('channel')
        .leftJoinAndSelect('channel.users', 'users')
        .where('users.id != :userId', { userId })
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
