import { Injectable } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PongService } from '../pong.service'
import { Paddle } from '../pong.utils';

@Injectable()
export class GameService {



	private queue : Socket[] = [];
	private games : Map<string, PongService> = new Map();

	async addToQueue(client: Socket): Promise<PongService>{
		this.queue.push(client);

		if (this.queue.length < 2)
			return;

		const newPong: PongService = new PongService();
		newPong.paddleLeft.socket = this.queue[0];
		newPong.paddleRight.socket = this.queue[1]; 
		return newPong;
				
	}

}
