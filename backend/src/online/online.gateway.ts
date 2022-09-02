import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WsException,  } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from 'src/auth/auth.service';
import {User, UserState} from '../users/user.entity';



@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'online'
})
export class OnlineGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
  ){}

  private server : Server;
  private logger : Logger = new Logger('OnlineGateway');

    async handleDisconnect(client: Socket){
      this.logger.log(`Client disconnected : ${client.id}`);
      if (client.data.user)
        await this.userService.changeUserStatus(client.data.user, UserState.OFFLINE)
    }

    async handleConnection(client: Socket){
      this.logger.log(`Client connected : ${client.id}`);

      try {
        const user: User = await this.authService.getUserFromSocket(client);
        if(!user){
          client.disconnect();
          return;
        }

        this.logger.log(`User ${user.userName42} is connected`);
        client.data.user = user;
        await this.userService.changeUserStatus(user, UserState.ONLINE)

      } catch (error) {
        
      }
    }

    async afterInit(server: Server) {
      this.logger.log('Initiated');
    }

    @SubscribeMessage('logout')
    async handleLogout(client: Socket, payload: any){
      await this.userService.changeUserStatus(client.data.user, UserState.OFFLINE);
      await client.disconnect();
    }
}
