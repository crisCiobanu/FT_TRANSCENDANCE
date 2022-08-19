import { Injectable } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PongService } from '../pong.service'
import { Paddle } from '../pong.utils';
import { IGame } from '../pong.interfaces';

@Injectable()
export class GameService {

	private queue : Socket[] = [];
	private games : Map<string, PongService> = new Map();

	constructor(
		private readonly pongService: PongService
	  ){}

	async addToQueue(client: Socket): Promise<PongService>{
		this.queue.push(client);

		if (this.queue.length < 2)
			return;

		const newGame: IGame = await this.pongService.createGame(this.queue[0], this.queue[1]);
		this.queue.shift();
		this.queue.shift();
		//const newPong: PongService = new PongService();
		// newPong.paddleLeft.socket = this.queue[0];
		// newPong.paddleLeft.user = newPong.paddleLeft.socket.data.user.id;
		// this.queue.shift();
		// newPong.paddleRight.socket = this.queue[0]; 
		// newPong.paddleRight.user = newPong.paddleRight.socket.data.user.id;
		// this.queue.shift();
		// newPong.name = newPong.paddleLeft.socket.data.user.userNmae42 + ' - ' + newPong.paddleRight.socket.data.user.userNmae42;
		
		// return newPong;
				
	}

}
