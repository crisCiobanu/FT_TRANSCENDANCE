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
	async create(pun: IPunishedUser){
		const newPun = await this.punRepository.create(pun);
		return this.punRepository.save(newPun);
	}

	async delete(){

	}

	async getBannedIds(){

	}

}
