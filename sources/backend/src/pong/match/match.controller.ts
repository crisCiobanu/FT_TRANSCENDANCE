import { Controller, Res, Req, Get, Post } from '@nestjs/common';
import { Match } from './match.entity'
import { MatchService} from './match.service'

@Controller('matches')
export class MatchController {

	constructor (
		private readonly matchService: MatchService
	){}

	@Post('getForUser')
	async getMatchesForUser(@Res({passthrough: true}) res: Response, @Req() req: any): Promise<Match[]>{
		return this.matchService.getMatchesByUser(req.body.id);
	}

}