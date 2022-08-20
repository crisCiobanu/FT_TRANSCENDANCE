import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WsException,  } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game/game.service';
import { AuthService} from '../auth/auth.service'
import { UsersService } from '../users/users.service';
import { IGame, State } from './pong.interfaces';
import { PongService } from './pong.service';
import { Interval } from '@nestjs/schedule';


@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'pong'
})
export class PongGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  constructor(
    private readonly gameService: GameService,
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly pongService: PongService
  ){}
   
  @WebSocketServer() 
  private server : Server;
  private logger : Logger = new Logger('PongGateway');
    
  async handleDisconnect(client: Socket) {

    this.logger.log(`Client disconnected : ${client.id}`);

  }

  async afterInit(server: Server) {
    this.logger.log('Initiated');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected : ${client.id}`);

    try {
      const user = await this.authService.getUserFromSocket(client);
      if(!user)
        client.disconnect();
      this.logger.log(`User ${user.userName42} is connected`);

      client.data.user = user;


    } catch (error) {
      
    }
  }
  @SubscribeMessage('ready')
  async onReady(client: Socket, payload: any){
    console.log("LOG FROM READY EVENT FUNCTION");
    console.log(payload);
    const game = await this.gameService.startGame(payload.name);
    if (game){
      console.log(" CONDITION IS TRUE IN READY ")
      this.gameService.startBall(game);
    }
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): string {
    return 'Hello world!';
  }

  @SubscribeMessage('waiting')
  async onWainting(client: Socket, payload: any){
    const pongGame = await this.gameService.addToQueue(client);
    if (pongGame){
      this.server.to(pongGame.leftPaddle.socket).emit('foundPeer', {game: pongGame, opponentId: pongGame.rightPaddle.userId});
      this.server.to(pongGame.rightPaddle.socket).emit('foundPeer', {game: pongGame, opponentId: pongGame.leftPaddle.userId});
    }
  }

  @SubscribeMessage('keyDown')
  async updatePaddleKeyDown(client: Socket, payload: any){
    const res = await this.gameService.updatePaddle(payload.name, payload.pos, payload.dy);
    if (!res)
      throw new WsException('UPDATE PADDLE FAILED');
  }

  @SubscribeMessage('keyUp')
  async updatePaddleKeyUp(client: Socket, payload: any){
    const res = await this.gameService.updatePaddle(payload.name, payload.pos, 0);
    if (!res)
      throw new WsException('UPDATE PADDLE FAILED');
  }

  async sendToAll(game: IGame, event: string, message){
    this.server.to(game.leftPaddle.socket).emit(event, message);
    this.server.to(game.rightPaddle.socket).emit(event, message);
    if (game.spectators){
      for (const socket of game.spectators){
        this.server.to(socket).emit(event, message);
      }
    }
  }

  @Interval(1000/ 60)
	async sendUpdate(){
    const games = this.gameService.getGames();
		for (const game of games.values()){
			if (game.state == State.INPROGRESS){
				const tempGame = await this.pongService.update(game);
        await this.gameService.saveGame(tempGame);
        this.sendToAll(game, 'updateGame', game);
        // console.log("LOG FROM SEND UPDATE")
        // console.log(game.leftPaddle.y + ' : ' + game.rightPaddle.y)
      }
		}
	}
		
	

}

