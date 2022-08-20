import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PongService } from '../pong.service'
import { UsersService } from '../../users/users.service';
import { Paddle } from '../pong.utils';
import { IGame, State } from '../pong.interfaces';
import { Interval } from '@nestjs/schedule';
import { IMatch } from './match.interface';

@Injectable()
export class GameService {

	private queue : Socket[] = [];
	private games : Map<string, IGame> = new Map();

	constructor(
		@Inject(forwardRef(() => PongService))
		private readonly pongService: PongService,
		private readonly userService: UsersService
	  ){}

	async addToQueue(client: Socket): Promise<IGame>{
		this.queue.push(client);
		console.log("LOG FROM ADD TO QUEUE")
		console.log(client.data.user.userName42);

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

	async endGame(game: IGame){
		console.log("LOG FROM END GAME");
		game.state = State.FINISHED;
		// const winner =  game.leftPaddle.score > game.rightPaddle.score ? game.name.split(' - ')[0] : game.name.split(' - ')[1];
		// const loser  = game.leftPaddle.score > game.rightPaddle.score ? game.name.split(' - ')[1] : game.name.split(' - ')[0];

		let match: IMatch = {score: `${game.leftPaddle.score} - ${game.rightPaddle.score}`,
							winner: game.leftPaddle.score > game.rightPaddle.score ? game.name.split(' - ')[0] : game.name.split(' - ')[1],
							loser: game.leftPaddle.score > game.rightPaddle.score ? game.name.split(' - ')[1] : game.name.split(' - ')[0]};

		this.userService.addMatch(match);
		this.saveGame(game);
		this.games.delete(game.name);
	}

	async updatePaddle(gameName: string, pos: string, dy: number){
		let game = this.games.get(gameName);
		
		if (!game){
			return null;
		}
		
		if (pos == 'leftpaddle'){
			game.leftPaddle.dy = dy;
		}
		else if (pos == 'rightpaddle'){
			game.rightPaddle.dy = dy;
		}
		return this.games.set(game.name, game);
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
