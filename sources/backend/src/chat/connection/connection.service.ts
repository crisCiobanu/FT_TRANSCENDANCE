import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import User from 'src/users/user.entity';
import { Connect } from 'twilio/lib/twiml/VoiceResponse';
import { Repository } from 'typeorm';
import { Connection } from './connection.entity';
import { IConnection } from './connection.interface';

@Injectable()
export class ConnectionService {

    
    constructor( 
        @InjectRepository(Connection)
        private readonly connectionRepository: Repository<Connection>){}
    
    async create(connection: IConnection): Promise<Connection>{
        return this.connectionRepository.save(connection);
    }

    async findByUserId(userId: number){
        const query = this.connectionRepository.createQueryBuilder('connection')
        .leftJoinAndSelect('connection.user', 'user')
        .where('user.id = :userId', { userId });
        const connections: Connection[] = await query.getMany();
        return connections;
    }

    async getAll(): Promise<IConnection[]> {
        return this.connectionRepository.createQueryBuilder('connection')
        .leftJoinAndSelect('connection.user', 'user')
        .getMany();
    }

    async deleteBySocketId(socket: string){
        return this.connectionRepository.delete({socket});
    }

    async deleteAll(){
        await this.connectionRepository.createQueryBuilder().delete().execute();
    }

}
