import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PunishedUser } from './punisheduser.entity';
import { IPunishedUser } from './punisheduser.interface';
import { Repository } from 'typeorm';

@Injectable()
export class PunisheduserService {
	constructor(
        @InjectRepository(PunishedUser)
        private readonly punRepository: Repository<PunishedUser>
    ){}
	async create(pun: IPunishedUser): Promise<PunishedUser>{
		const newPun = await this.punRepository.create(pun);
		return this.punRepository.save(newPun);
	}

	async update(pun: IPunishedUser): Promise<PunishedUser>{
		return this.punRepository.save(pun);
	}

	async delete(id : number){
		this.punRepository.delete({id});
	}

	async getBannedIds(){

	}

	async getBanByUserId(userId: number, channelName: string){
		const query = this.punRepository.createQueryBuilder('restriction')
        .leftJoinAndSelect('restriction.channel', 'channel')
        .where('restriction.userId = :userId', { userId })
		.andWhere('restriction.banned = true')
		.andWhere('channel.name = :channelName', {channelName});
        const banneduser : PunishedUser = await query.getOne();
        return banneduser;
	}

	async getMuteByUserId(userId: number, channelName: string){
		const query = this.punRepository.createQueryBuilder('restriction')
        .leftJoinAndSelect('restriction.channel', 'channel')
        .where('restriction.userId = :userId', { userId })
		.andWhere('restriction.muted = true')
		.andWhere('channel.name = :channelName', {channelName});
        const mutedUser : PunishedUser = await query.getOne();
        return mutedUser;
	}

}
