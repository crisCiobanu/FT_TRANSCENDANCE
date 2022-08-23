import { Controller, Get, Post } from '@nestjs/common';
import { PongService } from './pong.service';
import { GameService } from './game/game.service';

@Controller('pong')
export class PongController {

	constructor(
		private readonly pongService: PongService,
		private readonly gameService: GameService
	){

	}

	@Get('games')
    async getAllGames(){
		const games = await this.gameService.getAllGames();
		return games;
    }


}
