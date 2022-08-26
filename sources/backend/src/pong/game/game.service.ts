import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PongService } from '../pong.service'
import { UsersService } from '../../users/users.service';
import { User } from '../../users/user.entity';
import { Paddle } from '../pong.utils';
import { IGame, IPaddle,  State } from '../pong.interfaces';
import { Interval } from '@nestjs/schedule';
import { IMatch } from '../match/match.interface';
import { MatchService } from '../match/match.service';
import {v4 as uuidv4} from 'uuid';


@Injectable()
export class GameService {

	private queue : Socket[] = [];
	private games : Map<string, IGame> = new Map();
	private invites : Map<string, Socket> = new Map();
	private connectedUsers : Map<number, string> = new Map();


	constructor(
		@Inject(forwardRef(() => PongService))
		private readonly pongService: PongService,
		private readonly userService: UsersService,
		private readonly matchService: MatchService
	  ){}


	async addConnection(userId: number, socket: string){
		this.connectedUsers.set(userId, socket);
	}

	async removeConnection(socket: string){
		this.connectedUsers.forEach((value, key) => {
			if (value == socket)
				this.connectedUsers.delete(key);
		});		
	}

	async getConnectionByUserId(userId: number){
		return this.connectedUsers.get(userId);
	}
	
	async addToQueue(client: Socket): Promise<IGame>{
		this.queue.push(client);
		console.log("LOG FROM ADD TO QUEUE")
		console.log(client.data.user.userName42);

		if (this.queue.length < 2)
			return;

		const newGame: IGame = await this.pongService.createGame(this.queue[0], this.queue[1]);
		this.queue.shift();
		this.queue.shift();
		this.games.set(newGame.id, newGame);
		return newGame;
	}

	async createInviteGame(client: Socket, userName42: string){
		this.invites.set(userName42, client);
	}

	async abortInviteGame(client: Socket){
		console.log("LOG FROM ABORT INVITE");
		this.invites.forEach((value, key) => {
			if (value.id == client.id)
				this.invites.delete(key);
		});		
	}

	// async getMyInvites(socketId: string){

	// }

	async cancelInviteGame(client: Socket){
		console.log("LOG FROM CANCEL INVITE");
		this.invites.forEach((value, key) => console.log(`${key} - ${client.data.user.userName42}`));
		const hostGame = this.invites.get(client.data.user.userName42);
		if (hostGame != undefined){
			await this.invites.delete(client.data.user.userName42);
			return hostGame.id;
		}
		return null;
	}

	async findInviteGame(client: Socket): Promise<string>{
		const socket = this.invites.get(client.data.user.userName42);
		if (socket == undefined)
			return null;
		return socket.data.user.userName42;
	}

	async findPausedGame(client: Socket): Promise<IGame>{
		const userId = client.data.user.id;
		let game: IGame = null;
		await this.games.forEach((value, key) => {

			if (value.state == State.PAUSED){

				if(value.leftPaddle.userId == userId){
					console.log("LOG  FROM FIND PAUSED GAME    LEFT");
					console.log(value.name);
					value.leftPaddle.socket = client.id;
					game = value;
				}
					
				else if (value.rightPaddle.userId == userId){
					console.log("LOG  FROM FIND PAUSED GAME    RIGHT");
					console.log(value.name);
					value.rightPaddle.socket = client.id;
					game = value;
				}
			}
		});	
		return game;	
	}
	
	async getInviteGame(client: Socket){
		const firstSocket = this.invites.get(client.data.user.userName42);
		if (firstSocket == undefined)
			return null;
		const newGame: IGame = await this.pongService.createGame(firstSocket, client);
		this.invites.delete(client.data.user.userName42);
		this.games.set(newGame.id, newGame);
		return newGame;
	}

	// async startInviteGame(gameId: string){
	// 	let game = this.games.get(gameId);
	// 	game.state = State.INPROGRESS;
	// 	this.games.set(game.id, game);
	// 	if (game.state == State.INPROGRESS)
	// 		return game;
	// 	return null;
	// }

	async removeFromQueue(client: Socket){
		//this.queue.shift();
		this.queue = this.queue.filter(socket => socket.id != client.id);
	}

	async startGame(gameId: string){
		let game = this.games.get(gameId);
		if (!game)
			return null;
		game.accepted++;
		if (game.accepted == 2)
			game.state = State.INPROGRESS;
		this.games.set(game.id, game);
		if (game.state == State.INPROGRESS)
			return game;
	}

	async getAllGames(){
		return Array.from(this.games.values());
	}

	async addWatcher(gameId: string, socketId: string){
		let game: IGame = this.games.get(gameId);
		if (!game)
			return null;
		game.spectators.push(socketId);
		return this.games.set(game.id, game);
	}

	async getOpponentSocket(gameId : string, user: User){
		const tempGame = this.games.get(gameId);
		if (!tempGame)
			return null;
		if (tempGame.leftPaddle.userId != user.id && tempGame.rightPaddle.userId != user.id)
			return null;
		if(tempGame.leftPaddle.userId == user.id)
			return tempGame.rightPaddle.socket;
		else
			return tempGame.leftPaddle.socket;
	}

	async saveMatch(game: IGame, winnerId: number, loserId: number){
		let match: IMatch = { score: `${game.leftPaddle.score} - ${game.rightPaddle.score}`,
		winner: await this.userService.getById(winnerId),
		loser: await this.userService.getById(loserId)};
		await this.matchService.createMatch(match);
		await this.userService.updateScore(match);


		this.saveGame(game);
		this.games.delete(game.id);

	}

	async forfeitGame(gameId: string, user: User): Promise<string>{
		const tempGame = this.games.get(gameId);
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
		await this.saveMatch(tempGame, winner, loser);
			return res;
	}

	async winGame(gameId: string, user: User){
		const tempGame = this.games.get(gameId);
		let winner, loser, res;
		if (!tempGame)
			return null;
		if (tempGame.leftPaddle.userId != user.id && tempGame.rightPaddle.userId != user.id)
			return null;
		if (tempGame.leftPaddle.userId == user.id){
				winner = tempGame.leftPaddle.userId;
				loser = tempGame.rightPaddle.userId;
				res = tempGame.leftPaddle.socket;
		} else{
				winner = tempGame.rightPaddle.userId;
				loser = tempGame.leftPaddle.userId;
				res = tempGame.rightPaddle.socket;

		}
		await this.saveMatch(tempGame, winner, loser);
		return res;
	}

	async startBall(game: IGame){
		const startedGame: IGame = await this.pongService.startBall(game);
		this.games.set(startedGame.id, startedGame);
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
        this.games.delete(game.id);
    }

	async updatePaddle(gameId: string, pos: string, dy: number){
		let game = this.games.get(gameId);
		
		if (!game){
			return null;
		}
		
		if (pos == 'leftpaddle'){
			game.leftPaddle.dy = dy;
		}
		else if (pos == 'rightpaddle'){
			game.rightPaddle.dy = dy;
		}
		return this.games.set(game.id, game);
	}

	// async sendToAll(game: IGame, event: string, message: string){

	// }

	async getGameById(gameId: string): Promise<IGame>{
		return this.games.get(gameId);
	}

	async getUserGame(userId: number): Promise<IGame>{
		const game: IGame = Array.from(this.games.values()).find((game) => game.leftPaddle.userId == userId || game.rightPaddle.userId == userId);
		if (game == undefined)
			return null;
		return game;
	}

	async saveGame(game: IGame){
		this.games.set(game.id, game);
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
