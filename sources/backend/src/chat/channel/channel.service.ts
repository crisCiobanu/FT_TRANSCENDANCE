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
import { PunisheduserService} from '../punisheduser/punisheduser.service'
import { PunishedUser} from '../punisheduser/punisheduser.entity'

@Injectable()
export class ChannelService {
    constructor(
        @InjectRepository(Channel)
        private readonly channelRepository: Repository<Channel>,
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private readonly punishedUserService: PunisheduserService
    ){}

    async createChannel(channel : any, owner: User): Promise<Channel>{
        const findChannel = await this.getChannelByName(channel.name);
        if (findChannel)
            return null;          
        const tempChannel = await this.addOwnerToChannel(channel, owner);
        if (tempChannel.isPublic == false)
            tempChannel.password = await bcrypt.hash(channel.password, 5);             
        return this.channelRepository.save(tempChannel);
    }

    async createPrivateMessage(owner: User, otherUser: User): Promise<Channel>{
        const channelName = owner.userName42 + " - " + otherUser.userName42;
        const inverseChannelName = otherUser.userName42 + " - " + owner.userName42
        const foundByName = await this.getChannelByName(channelName);
        const foundByInverseName = await this.getChannelByName(inverseChannelName);
        if (foundByName || foundByInverseName)
            return null;
        
        const channel: IChannel = {name: channelName, isDirectMessage: true}
            
        let tempChannel = await this.addOwnerToChannel(channel, owner);
        tempChannel.users.push(otherUser);

        return this.channelRepository.save(tempChannel);
    }

    async joinChannel(channel : IChannel, newUser: User): Promise<Channel>{
        const tempChannel = await this.getChannelByName(channel.name);
        if (!tempChannel)
            return null;
        
        if (!tempChannel.isPublic){
            let accepted: boolean  = false;
            if (channel.password)
                accepted = await bcrypt.compare(channel.password, tempChannel.password);
            if (accepted == false)
                return null;
        }
        tempChannel.users.push(newUser);
        return this.channelRepository.save(tempChannel); 
    }

    async checkIfBaned(channel : IChannel, usr: User) : Promise<boolean>{
        const ban = await this.punishedUserService.getBanByUserId(usr.id, channel.name);
        if (ban && ban.banned == true){
            if (ban.expires.getTime() > new Date().getTime())
                return true;
            else {
                await this.punishedUserService.delete(ban.id);
                return false;
            }
        }
    }

    async checkIfMuted(channel : IChannel, usr: User) : Promise<boolean>{
        const mute = await this.punishedUserService.getMuteByUserId(usr.id, channel.name);
        if (mute && mute.muted == true){
            if (mute.expires.getTime() > new Date().getTime()){
                return true;
            }
            else {
                await this.punishedUserService.delete(mute.id);
                return false;
            }
        }
    }

    async leaveChannel(channel : IChannel, userToLeave: User): Promise<Channel>{
        let tempChannel = await this.getChannelByName(channel.name);
        if (!tempChannel)
            return null;
        tempChannel.users = tempChannel.users.filter((u) => u.userName42 != userToLeave.userName42);
        tempChannel = await this.channelRepository.save(tempChannel); 
        return tempChannel;
    }

    async deleteChannel(channel : IChannel, user: User){
        const tempChannel = await this.getChannelByName(channel.name);
        if (!tempChannel)
            return null;
        if (tempChannel.isDirectMessage == false &&  tempChannel.channelOwnerId !== user.id)
            throw new WsException('NOT AUTHORIZED DO DELETE THIS ROOM');
        await this.channelRepository.delete({id: tempChannel.id });
    }

    async removePassword(channelName: string, ){
        let tempChannel = await this.getChannelByName(channelName);
        if (!tempChannel)
            return null;
        tempChannel.isPublic = true;
        tempChannel.password = null;
        tempChannel = await this.channelRepository.save(tempChannel);
        return tempChannel;
    }

    async changePassword(channelName: string, password: string){
        let tempChannel = await this.getChannelByName(channelName);
        if (!tempChannel)
            return null;
        tempChannel.password =  await bcrypt.hash(password, 5);

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
        .where('users.id = :userId', { userId })
        .andWhere('channel.isDirectMessage = false');
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


    async getAllChannels(userId: number): Promise<Channel[]>{
        return this.channelRepository.createQueryBuilder('channel')
        .leftJoinAndSelect('channel.users', 'users', 'users.id = :userId', { userId })
        .where('users.id != :userId', { userId })
        .getMany();
    }

    async getAll(): Promise<Channel[]>{
        const channels = await this.channelRepository.find({
            relations: {
                users: true,
                messages: {
                    user: true,
                    channel: true
                },
                bansAndMutes: true
            },
            where: {
                isDirectMessage: false
            }
        })
        return channels;
    }

    async getAllDirectMessages(iNuser: User): Promise<Channel[]>{
        let channels = await this.channelRepository.find({
            relations: {
                users: true,
                messages: {
                    user: true,
                    channel: true
                },
                bansAndMutes: true
            },
            where: {
                isDirectMessage: true,
            }
        })
        channels = channels.filter(channel => channel.users.find(user => user.id == iNuser.id) != undefined)
        return channels;
    }

    async muteUser(channel: Channel, user: User, minutes: number): Promise<PunishedUser>{
        const expire_epoch = new Date().getTime() + minutes * 60000;
        const expire_at = new Date(expire_epoch);
        const punish = await this.punishedUserService.getMuteByUserId(user.id, channel.name);
        console.log(punish);
        if (punish){
            if (punish.expires.getTime() <= expire_epoch){
                punish.expires = expire_at;
                return this.punishedUserService.update(punish);
            }
            else
                return null;
        }   else{ 
        const newPunish = await this.punishedUserService.create({expires: expire_at,
                                                            muted: true,
                                                            userId: user.id,
                                                            channel: channel});
            return newPunish;
        }
    }

    async banUser(channel: Channel, bannedUser: User, minutes: number){
        const expire_epoch = new Date().getTime() + minutes * 60000;
        const expire_at = new Date(expire_epoch);
        const punish = await this.punishedUserService.getBanByUserId(bannedUser.id, channel.name);
        if (punish){
            if (punish.expires.getTime() <= expire_epoch){
                punish.expires = expire_at;
                return this.punishedUserService.update(punish);
            }
            else
                return null;
        }   else{ 
        const newPunish = await this.punishedUserService.create({expires: expire_at,
                                                            banned: true,
                                                            userId: bannedUser.id,
                                                            channel: channel});
        channel.users = channel.users.filter(user => user.id != bannedUser.id);
        return this.channelRepository.save(channel);
        }
    }

    async kickUser(channel: Channel, bannedUser: User){
        channel.users = channel.users.filter(user => user.id != bannedUser.id);
        return this.channelRepository.save(channel);
        }

    async addUserToAdmins(channel: Channel, user: User): Promise<Channel>{
        if (channel.channelAdminsId.find(id => id == user.id) != undefined)
            return null;
        channel.channelAdminsId.push(user.id);
        return this.channelRepository.save(channel);
    }

    async deleteUserFromAdmins(channel: Channel, user: User): Promise<Channel>{
        if (channel.channelAdminsId.find(id => id == user.id) == undefined)
            return null;
        channel.channelAdminsId = channel.channelAdminsId.filter((id) => id != user.id)
        return this.channelRepository.save(channel);
    }

    async deleteAllChannels(){
        await this.channelRepository.clear();
    }

    printChannels(channels : Channel[]){
        console.log("Users channels are : ");
        console.log(channels);
    }

}
