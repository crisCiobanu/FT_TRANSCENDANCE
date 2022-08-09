import { Logger } from '@nestjs/common';
import { OnGatewayConnection, 
          OnGatewayDisconnect, 
          OnGatewayInit, 
          SubscribeMessage, 
          WebSocketGateway, 
          WebSocketServer } from '@nestjs/websockets';

import { Server, Socket } from 'socket.io'
import { AuthService } from 'src/auth/auth.service';
import { IChannel } from './channel/channel.interface';
import { IMessage } from './message/message.interface';
import { MessageService } from './message/message.service';
import { ChannelService } from './channel/channel.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  }
})

export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{
  

  constructor(
    private readonly authService: AuthService,
    private readonly channnelService: ChannelService,
    private readonly messageService: MessageService

  ){}

  @WebSocketServer() server : Server;
  private logger : Logger = new Logger('ChatGateway');

  
  handleDisconnect(client: Socket) {
      this.logger.log(`Client disconnected : ${client.id}`);
  }
async handleConnection(client: Socket, ...args: any[]) {

      this.logger.log(`Client connected : ${client.id}`)
      try {
        const user = await this.authService.getUserFromSocket(client);
        if(!user)
          client.disconnect();
        this.logger.log(`User ${user.userName42} is connected`);

        client.data.user = user;

        this.sendInit(client, 'init');

      } catch (error) {
        
      }
  }

  private async sendInit(client: Socket, event: string){
    const directMessageChannels = await this.channnelService.getDirectMessageChannels(client.data.user.id);     
    const userChannels = await this.channnelService.getChannelsByUserId(client.data.user.id);
    const allChannels = await this.channnelService.getAllChannels(client.data.user.id);

    this.server.to(client.id).emit(event, {allChannels, userChannels, directMessageChannels});   
  }

  afterInit(server: Server) {
      this.logger.log('Initiated');
  }

  @SubscribeMessage('msgToServer')
  handleMessage(client: Socket, payload: string): void {

    this.server.emit('msgToClient', payload);
  }

  @SubscribeMessage('createRoom')
  async createChannel(client: Socket, payload: any) {
    const newChannel = await this.channnelService.createChannel(payload, client.data.user);

    if (newChannel){
      const userChannels = await this.channnelService.getChannelsByUserId(client.data.user.id);
      await this.sendInit(client, 'createChannel');
    }
  }

  @SubscribeMessage('message')
  async onNewMessage(client: Socket, msg: IMessage){

    console.log(msg);
    msg.user = client.data.user;
    const newMsg = await this.messageService.createMessage(msg);

    console.log("LOG OF NEW MSG");
    console.log(newMsg);

    this.server.emit('msgToClient', newMsg);
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
