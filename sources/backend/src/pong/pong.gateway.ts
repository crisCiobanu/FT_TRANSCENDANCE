import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WsException,  } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game/game.service';
import { AuthService} from '../auth/auth.service'
import { UsersService } from '../users/users.service';
import { IGame, State } from './pong.interfaces';
import { PongService } from './pong.service';
import { Interval } from '@nestjs/schedule';
import { UserState } from 'src/users/user.entity';


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

    // this.logger.log(`Client disconnected : ${client.id}`);
    if (client.data.user){
      await this.userService.changeUserStatus(client.data.user, UserState.OFFLINE);
      await this.gameService.removeConnection(client.id);
      const game = await this.gameService.getUserGame(client.data.user.id);
      if (game){
        game.state = State.PAUSED;
        // console.log("LOG FOR PAUSE GAME AT DISCONNECT");
      
        await this.gameService.saveGame(game);
        const oponnentSocket = await this.gameService.getOpponentSocket(game.id, client.data.user);
        await this.sendToOpponnentAndSpectators(game, oponnentSocket, 'pausedGame', null);
      }
      else {
        this.gameService.removeFromQueue(client);
        this.gameService.abortInviteGame(client);
      }
      }
  }
  
  async afterInit(server: Server) {
    this.logger.log('Initiated');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected : ${client.id}`);

    try {
      const user = await this.authService.getUserFromSocket(client);
      if(!user){
        client.disconnect();
        return;
      }
      this.logger.log(`User ${user.userName42} is connected`);

      client.data.user = user;
      await this.userService.changeUserStatus(user, UserState.GAMING);
      await this.gameService.addConnection(user.id, client.id);

      const pausedGame = await this.gameService.findPausedGame(client);
      // console.log("LOG FOR PAUSED GAME");
      // console.log(pausedGame);
      if (pausedGame){     
        pausedGame.state = State.INPROGRESS;
        const opponentId = pausedGame.leftPaddle.userId == client.data.user.id ? pausedGame.rightPaddle.userId : pausedGame.leftPaddle.userId;
        await this.server.to(client.id).emit('comeBack', {game: pausedGame, opponentId: opponentId});
        await this.sendToAll(pausedGame, 'resumeGame', null);
        await this.gameService.saveGame(pausedGame);
      }
      else {
        const hostGameName = await this.gameService.findInviteGame(client);
        if (hostGameName)
          await this.server.to(client.id).emit('invitationRequest', hostGameName);
      }
    } catch (error) {
      
    }
  }
  @SubscribeMessage('ready')
  async onReady(client: Socket, payload: any){
    // console.log("LOG FROM READY EVENT FUNCTION");
    // console.log(payload);
    const game = await this.gameService.startGame(payload.gameId);
    if (game){
      // console.log(" CONDITION IS TRUE IN READY ")
      this.gameService.startBall(game);
    }
  }

  @SubscribeMessage('forfeit')
  async forfeitGame(client: Socket, payload: any){
    const winner = await this.gameService.forfeitGame(payload.gameId, client.data.user);
    if (!winner){
        
    }
    this.server.to(winner).emit('winByForfeit');
  }

  @SubscribeMessage('wonByTimeOut')
  async onWonByTimeOut(client: Socket, payload: any){
    const winner = await this.gameService.winGame(payload.gameId, client.data.user);
    if (!winner){
        
    }
    this.server.to(winner).emit('wonByTimeOutResponse');
  }

  @SubscribeMessage('cancelGame')
  async cancelGame(client: Socket, payload: any){
    await this.gameService.removeFromQueue(client);
  }

  @SubscribeMessage('watchGame')
  async onWatchFame(client: Socket, payload: any){
    const game = await this.gameService.addWatcher(payload.gameId, client.id);
    if (!game){
      this.server.to(client.id).emit('watchGameResponse', 'noGame');
      return;
    }
    this.server.to(client.id).emit('watchGameResponse', 'goWatchGame');
  }

  @SubscribeMessage('waiting')
  async onWainting(client: Socket, payload: any){
    const isInGmae = await this.gameService.checkQueue(client);
    if (isInGmae == true){
      this.server.to(client.id).emit('samePlayer');
      return;
    }
    const pongGame = await this.gameService.addToQueue(client);
    if (pongGame){
      this.server.to(pongGame.leftPaddle.socket).emit('foundPeer', {game: pongGame, opponentId: pongGame.rightPaddle.userId});
      this.server.to(pongGame.rightPaddle.socket).emit('foundPeer', {game: pongGame, opponentId: pongGame.leftPaddle.userId});
    }
  }

  @SubscribeMessage('inviteToGame')
  async onInvite(client: Socket, payload: any){
    const pongGame = await this.gameService.createInviteGame(client, payload.userName42);
    const invitedUser = await this.userService.getByLogin42(payload.userName42);
    if (invitedUser.state == UserState.GAMING){
      const userSocket = await this.gameService.getConnectionByUserId(invitedUser.id);
      if (userSocket != undefined)
        await this.server.to(userSocket).emit('liveInvitationRequest', client.data.user.userName42);
    }
  }

  @SubscribeMessage('cancelInvite')
  async onAbortInvite(client: Socket, payload: any){
    await this.gameService.abortInviteGame(client);    
  }

  @SubscribeMessage('declineInvite')
  async onCancelInvite(client: Socket, payload: any){
    const socket = await this.gameService.cancelInviteGame(client)
    if (socket){
      this.server.to(socket).emit('declinedResponse', client.data.user.userName42);
    }
  }

  @SubscribeMessage('acceptInvite')
  async onAcceptInvite(client: Socket, payload: any){
    const game = await this.gameService.getInviteGame(client);
    if (!game){
      this.server.to(client.id).emit('acceptInviteResponse', 'noGame');
    }
    else {
      this.server.to(game.leftPaddle.socket).emit('foundPeer', {game: game, opponentId: game.rightPaddle.userId});
      this.server.to(game.rightPaddle.socket).emit('foundPeer', {game: game, opponentId: game.leftPaddle.userId});
    }
  }

  @SubscribeMessage('keyDown')
  async updatePaddleKeyDown(client: Socket, payload: any){
    const res = await this.gameService.updatePaddle(payload.gameId, payload.pos, payload.dy);
    if (!res)
      throw new WsException('UPDATE PADDLE FAILED');
  }

  @SubscribeMessage('keyUp')
  async updatePaddleKeyUp(client: Socket, payload: any){
    const res = await this.gameService.updatePaddle(payload.gameId, payload.pos, 0);
    if (!res)
      throw new WsException('UPDATE PADDLE FAILED');
  }

  @SubscribeMessage('byebye')
  async onByeBye(client: Socket){
    await this.gameService.removeFromQueue(client);
    await this.gameService.abortInviteGame(client);
    this.server.to(client.id).emit('declineResponse');
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

  async sendToOpponnentAndSpectators(game: IGame, opponent: string, event: string, message){
    this.server.to(opponent).emit(event, message);
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
      }
		}
	}
		
	

}

