import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service'


@Injectable()
export class NotifyService{

	private connectedUsers : Map<number, string> = new Map();

	constructor(
		private readonly userService: UsersService,
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
}