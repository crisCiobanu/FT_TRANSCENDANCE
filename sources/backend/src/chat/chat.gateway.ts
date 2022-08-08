import { Logger } from '@nestjs/common';
import { OnGatewayConnection, 
          OnGatewayDisconnect, 
          OnGatewayInit, 
          SubscribeMessage, 
          WebSocketGateway, 
          WebSocketServer } from '@nestjs/websockets';

import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: '*',
  }
})

export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{
  
  @WebSocketServer() server : Server;
  private logger : Logger = new Logger('ChatGateway');

  
  handleDisconnect(client: Socket) {
      this.logger.log(`Client disconnected : ${client.id}`);
  }
  handleConnection(client: Socket, ...args: any[]) {
      this.logger.log(`Client connected : ${client.id}`)
  }
  afterInit(server: Server) {
      this.logger.log('Initiated');
  }

  @SubscribeMessage('msgToServer')
  handleMessage(client: Socket, payload: string): void {
    this.server.emit('msgToClient', payload);
  }

  @SubscribeMessage('testMessage')
  hand(client: Socket, payload: string): void {
    client.handshake.headers
    this.server.emit('msg', { id: 1, name: "testname"});
    this.logger.log(`Received the message ${payload}`);
  }
}
