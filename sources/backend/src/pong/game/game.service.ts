import { Injectable } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PongService } from '../pong.service'
import { Paddle } from '../pong.utils';
import { IGame, State } from '../pong.interfaces';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class GameService {

	private queue : Socket[] = [];
	private games : Map<string, IGame> = new Map();

	constructor(
		private readonly pongService: PongService
	  ){}

	async addToQueue(client: Socket): Promise<IGame>{
		this.queue.push(client);

		if (this.queue.length < 2)
			return;

		const newGame: IGame = await this.pongService.createGame(this.queue[0], this.queue[1]);
		this.queue.shift();
		this.queue.shift();
		this.games.set(newGame.name, newGame);
		return newGame;
	}

	async startGame(gameName: string){
		let game = this.games.get(gameName);
		game.accepted++;
		if (game.accepted == 2)
			game.state = State.INPROGRESS;
		this.games.set(game.name, game);
		if (game.state == State.INPROGRESS)
			return game;
		return null;
	}

	async startBall(game: IGame){
		const startedGame: IGame = await this.pongService.startBall(game);
		this.games.set(startedGame.name, startedGame);
	}

	// async sendToAll(game: IGame, event: string, message: string){

	// }

	async getGameBYName(name: string): Promise<IGame>{
		return this.games.get(name);
	}

	async saveGame(game: IGame){
		this.games.set(game.name, game);
	}

	getGames(): Map<string, IGame>{
		return this.games;
	}



	// async sendToAll(game: IGame, event: string, message){
	// 	this.server.to(game.leftPaddle.socket).emit(event, message);
	// 	this.server.to(game.rightPaddle.socket).emit(event, message);
	// 	if (game.spectators){
	// 	  for (const socket of game.spectators){
	// 		this.server.to(socket).emit(event, message);
	// 	  }
	// 	}
	//   }

	// @Interval(1000/ 60)
	// sendUpdate(){
	// 	for (const game of this.games.values()){
	// 		if (game.state == State.INPROGRESS)
	// 			this.pongService.update(game);
	// 	}
	// }

}
