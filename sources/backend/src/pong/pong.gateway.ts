import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit,  } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game/game.service';
import { AuthService} from '../auth/auth.service'
import { UsersService } from '../users/users.service';


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
    private readonly authService: AuthService
  ){}
   
  @WebSocketServer() server : Server;
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

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): string {
    return 'Hello world!';
  }

  @SubscribeMessage('waiting')
  async onWainting(client: Socket, payload: any){
    const pongGame = await this.gameService.addToQueue(client);
    if (pongGame){
      // this.server.to(pongGame.paddleLeft.socket.id).emit('foundPeer', pongGame.paddleRight.user);
      // this.server.to(pongGame.paddleRight.socket.id).emit('foundPeer', pongGame.paddleLeft.user);
    }
  }
}

