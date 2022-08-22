import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PongService } from '../pong.service'
import { UsersService } from '../../users/users.service';
import { User } from '../../users/user.entity';
import { Paddle } from '../pong.utils';
import { IGame, State } from '../pong.interfaces';
import { Interval } from '@nestjs/schedule';
import { IMatch } from '../match/match.interface';
import { MatchService } from '../match/match.service'


@Injectable()
export class GameService {

	private queue : Socket[] = [];
	private games : Map<string, IGame> = new Map();

	constructor(
		@Inject(forwardRef(() => PongService))
		private readonly pongService: PongService,
		private readonly userService: UsersService,
		private readonly matchService: MatchService
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

	async forfeitGame(gameName: string, user: User): Promise<string>{
		const tempGame = this.games.get(gameName);
		let winner, loser, res;
		if (!tempGame)
			return null;
		if (tempGame.leftPaddle.userId != user.id && tempGame.rightPaddle.userId != user.id)
			return null;
		if (tempGame.leftPaddle.userId == user.id){
				winner = tempGame.rightPaddle.userId;
				loser = tempGame.leftPaddle.userId;
				res = tempGame.rightPaddle.socket;
		} else{
				winner = tempGame.leftPaddle.userId;
				loser = tempGame.rightPaddle.userId;
				res = tempGame.leftPaddle.socket;

		}

			let match: IMatch = { score: `${tempGame.leftPaddle.score} - ${tempGame.rightPaddle.score}`,
			winner: await this.userService.getById(winner),
			loser: await this.userService.getById(loser)};
			await this.matchService.createMatch(match);
			await this.userService.updateScore(match);


			this.saveGame(tempGame);
			this.games.delete(tempGame.name);
			return res;
	}

	async startBall(game: IGame){
		const startedGame: IGame = await this.pongService.startBall(game);
		this.games.set(startedGame.name, startedGame);
	}

	async endGame(game: IGame){
        console.log("LOG FROM END GAME");
        game.state = State.FINISHED;
        const winner =  game.leftPaddle.score > game.rightPaddle.score ? game.leftPaddle.userId : game.rightPaddle.userId;
        const loser  =  game.leftPaddle.score > game.rightPaddle.score ? game.rightPaddle.userId : game.leftPaddle.userId;
        let match: IMatch = { score: `${game.leftPaddle.score} - ${game.rightPaddle.score}`,
                            winner: await this.userService.getById(winner),
                            loser: await this.userService.getById(loser)};
        await this.matchService.createMatch(match);
		await this.userService.updateScore(match);
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

	async getUserGame(userId: number): Promise<IGame>{
		const game: IGame = Array.from(this.games.values()).find((game) => game.leftPaddle.userId == userId || game.rightPaddle.userId == userId);
		if (game == undefined)
			return null;
		return game;
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
