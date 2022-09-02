import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { use } from 'passport';
import User from 'src/users/user.entity';
import { Message } from 'twilio/lib/twiml/MessagingResponse';
import { Repository } from 'typeorm';
import { Match } from './match.entity';
import { IMatch } from './match.interface';
@Injectable()
export class MatchService {
    constructor(
        @InjectRepository(Match)
        private readonly matchRepository: Repository<Match>
    ){}
    async createMatch(match: IMatch): Promise<Match>{
        const newMatch = await this.matchRepository.create(match);
        return this.matchRepository.save(newMatch);
    }
    async getMatchesByUser(userId: number) : Promise<Match[]>{
        const matches: Match[] = await this.matchRepository.find({
            relations: {
                winner: true,
                loser: true
            },
            where: [{ winner: {id: userId}},
                    {loser: {id: userId}}]
        })
		return matches;
    }
}









