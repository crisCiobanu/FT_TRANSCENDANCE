import { Logger } from '@nestjs/common';
import { OnGatewayConnection, 
          OnGatewayDisconnect, 
          OnGatewayInit, 
          SubscribeMessage, 
          WebSocketGateway, 
          WebSocketServer, 
          WsException} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io'
import { AuthService } from 'src/auth/auth.service';
import { IChannel } from './channel/channel.interface';
import { IMessage } from './message/message.interface';
import { MessageService } from './message/message.service';
import { ChannelService } from './channel/channel.service';
import { ConnectionService } from './connection/connection.service';
import { IConnection } from './connection/connection.interface';
import { Channel } from './channel/channel.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  }
})

export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{
  

  constructor(
    private readonly authService: AuthService,
    private readonly channnelService: ChannelService,
    private readonly messageService: MessageService,
    private readonly connectionService: ConnectionService

  ){}

  @WebSocketServer() server : Server;
  private logger : Logger = new Logger('ChatGateway');

  
 async handleDisconnect(client: Socket) {
    await this.connectionService.deleteBySocketId(client.id);

    this.logger.log(`Client disconnected : ${client.id}`);
  }

  async afterInit(server: Server) {
    await this.connectionService.deleteAll();
    this.logger.log('Initiated');
}

async handleConnection(client: Socket, ...args: any[]) {

      this.logger.log(`Client connected : ${client.id}`)
      try {
        const user = await this.authService.getUserFromSocket(client);
        if(!user)
          client.disconnect();
        this.logger.log(`User ${user.userName42} is connected`);

        client.data.user = user;

        this.connectionService.create({'socket': client.id, 'user': client.data.user});

        this.sendInit(client, 'init');

      } catch (error) {
        
      }
  }

  private async sendInit(client: Socket, event: string){
    const directMessageChannels: Channel[] = await this.channnelService.getDirectMessageChannels(client.data.user.id);     
    const userChannels: Channel[]  = await this.channnelService.getChannelsByUserId(client.data.user.id);
    const allChannels: Channel[]  = await this.channnelService.getAllChannels(client.data.user.id);

    if (event === 'init')
      this.server.to(client.id).emit(event, {allChannels, userChannels, directMessageChannels}); 
    else if (event === 'createChannel'){
      this.server.emit(event, {allChannels, userChannels, directMessageChannels});   
      const tempChannels = await this.channnelService.getAll();
      client.broadcast.emit('someoneCreatedChannel', {tempChannels});
    }
  }



  private async sendDirectMessageInit(client: Socket, channel: IChannel){
    const directMessageChannels = await this.channnelService.getDirectMessageChannels(client.data.user.id);     
    const userChannels = await this.channnelService.getChannelsByUserId(client.data.user.id);
    const allChannels = await this.channnelService.getAllChannels(client.data.user.id);

    for ( const user of channel.users){
      const connections: IConnection[] = await this.connectionService.findByUserId(user.id);
      for (const connection of connections){
        this.server.to(connection.socket).emit('createDirectMessage', {allChannels, userChannels, directMessageChannels});
      }
    }   
  }

  private async sendMessage(client: Socket, message: IMessage){

    const channel = message.channel;
    for ( const user of channel.users){
      const connections: IConnection[] = await this.connectionService.findByUserId(user.id);
      for (const connection of connections){
        this.server.to(connection.socket).emit('msgToClient', message);
      }
    }   
  }

  private async sendCreatedRoom(client: Socket, channel: IChannel){
    if (channel.isDirectMessage === true){
      for ( const user of channel.users){
        const connections: IConnection[] = await this.connectionService.findByUserId(user.id);
        for (const connection of connections){
          this.server.to(connection.socket).emit('addDirectMessageRoom', channel);
        }
      }  
    } else {
        const connections: IConnection[] = await this.connectionService.getAll();
        for (const connection of connections){
          if (client.data.user.id === connection.user.id){

            console.log("IN ADD TO MY ROOMS")
            this.server.to(connection.socket).emit('addToMyRooms', channel);
          }
          else{
            console.log("IN ADD TO ALL ROOMS");
            this.server.to(connection.socket).emit('addToAllRooms', channel);

          }
        }
     
    }
  }




  @SubscribeMessage('msgToServer')
  handleMessage(client: Socket, payload: string): void {

    this.server.emit('msgToClient', payload);
  }

  // @SubscribeMessage('createRoom')
  // async createChannel(client: Socket, payload: IChannel) {
  //   const newChannel = await this.channnelService.createChannel(payload, client.data.user);

  //   if (newChannel){
  //     if (newChannel.isDirectMessage === true)
  //       await this.sendDirectMessageInit(client, newChannel);
  //     else
  //       await this.sendInit(client, 'createChannel');
  //   }
  //   else
  //     throw new WsException('Problem while creating the new room');
  // }

  @SubscribeMessage('createRoom')
  async createChannel(client: Socket, payload: IChannel) {
    const newChannel = await this.channnelService.createChannel(payload, client.data.user);

    if (newChannel)
      this.sendCreatedRoom(client, newChannel)
    else
      throw new WsException('Problem while creating the new room');
  }

  @SubscribeMessage('joinRoom')
  async joinChannel(client: Socket, payload: any) {
    const tempChannel = await this.channnelService.joinChannel(payload, client.data.user);
    if (tempChannel)
      return tempChannel;
  }

  @SubscribeMessage('message')
  async onNewMessage(client: Socket, msg: IMessage){

    console.log(msg);
    msg.user = client.data.user;
    const newMsg = await this.messageService.createMessage(msg);

    console.log("LOG OF NEW MSG");
    console.log(newMsg);

    this.sendMessage(client, msg);
  }



  @SubscribeMessage('testMessage')
  async hand(client: Socket, payload: string): Promise<void> {
    console.log(`The header is : ${client.handshake.auth.token}`);
    console.log(`The user is : ${client.data.user.id} ${client.data.user.userName42}`);

    const channel : IChannel = {
      name: "Test-channel",
      description: "A test channel description"    
    }

    await this.channnelService.createChannel(channel, client.data.user);

    this.server.emit('msg', { id: 1, name: "testname"});
    this.logger.log(`Received the message ${payload}`);
  }
}
