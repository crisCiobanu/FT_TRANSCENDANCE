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
import { UsersService } from 'src/users/users.service';

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
    private readonly connectionService: ConnectionService,
    private readonly userService: UsersService
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
    //const directMessageChannels: Channel[] = await this.channnelService.getDirectMessageChannels(client.data.user.id); 
    const directMessageChannels: Channel[] = await this.channnelService.getAllDirectMessages(client.data.user.id);
  
    const allChannels: Channel[]  = await this.channnelService.getAll();

    this.server.to(client.id).emit(event, {allChannels, directMessageChannels}); 

  }

  private async sendPartInit(client: Socket, event: string){
    const allChannels: Channel[]  = await this.channnelService.getAll();

    this.server.to(client.id).emit(event, allChannels); 
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

  private async sendCreatedRoom(client: Socket, channel: IChannel){
    if (channel.isDirectMessage === true){
      this.sendUpdatePrivateMessages(client, channel);
    } else
      this.sendUpdateChannels(client);
  }

  private async sendUpdatePrivateMessages(client: Socket, channel: IChannel){
    const channels = await this.channnelService.getAllDirectMessages(client.data.user.id);
    for ( const user of channel.users){
      const connections: IConnection[] = await this.connectionService.findByUserId(user.id);
      for (const connection of connections){
        this.server.to(connection.socket).emit('updatePrivateMessages', channels);
      }
    }  
  }

  private async sendUpdateChannels(client: Socket){
    const channels = await this.channnelService.getAll();
    this.server.emit('updateChannels', channels);
  }
  
  // private async sendAlert(client: Socket, msg: string){
  //     this.server.to(client.id).emit('jo', msg);
  // }

  // private async sendCreatedRoom(client: Socket, channel: IChannel){
  //   if (channel.isDirectMessage === true){
  //     for ( const user of channel.users){
  //       const connections: IConnection[] = await this.connectionService.findByUserId(user.id);
  //       for (const connection of connections){
  //         this.server.to(connection.socket).emit('addDirectMessageRoom', channel);
  //       }
  //     }  
  //   } else {
  //       const connections: IConnection[] = await this.connectionService.getAll();
  //       for (const connection of connections){
  //         if (client.data.user.id === connection.user.id){

  //           console.log("IN ADD TO MY ROOMS")
  //           this.server.to(connection.socket).emit('addToMyRooms', channel);
  //         }
  //         else{
  //           console.log("IN ADD TO ALL ROOMS");
  //           this.server.to(connection.socket).emit('addToAllRooms', channel);

  //         }
  //       }
     
  //   }
  // }




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

  @SubscribeMessage('makeAdmin')
  async giveAdminPrivilegies(client: Socket, payload){
    console.log("CHANNEL FROM MAKE ADMIN")
    console.log(payload.channel);
    console.log(`USER name from make admin ${payload.userName42}`);
    const user = await this.userService.getByLogin42(payload.userName42);
    if (!user || !payload.channel){
      this.server.to(client.id).emit('makeAdminResponse', 'false');
      return;
    }
    const tmpChannel = await this.channnelService.addUserToAdmins(payload.channel, user);
    if (!tmpChannel)
      this.server.to(client.id).emit('makeAdminResponse', 'alreadyAdmin');
    else{
      this.server.to(client.id).emit('makeAdminResponse', 'true');
      this.sendUpdateChannels(client);
      await this.sendAllert(user.id, payload.channel.name, 'youAreNowAdmin');
    }
  }

  @SubscribeMessage('removeAdmin')
  async removeAdminPrivilegies(client: Socket, payload){
    console.log("CHANNEL FROM REMOVE ADMIN")
    console.log(payload.channel);
    console.log(`USER name from remove admin ${payload.userName42}`);
    const user = await this.userService.getByLogin42(payload.userName42);
    if (!user || !payload.channel){
      this.server.to(client.id).emit('removeAdminResponse', 'false');
      return;
    }
    const tmpChannel = await this.channnelService.deleteUserFromAdmins(payload.channel, user);
    if (!tmpChannel)
      this.server.to(client.id).emit('removeAdminResponse', 'notAdmin');
    else{
      this.server.to(client.id).emit('removeAdminResponse', 'true');
      this.sendUpdateChannels(client);
      await this.sendAllert(user.id, payload.channel.name, 'youAreNoMoreAdmin');
    }
  }

  @SubscribeMessage('createRoom')
  async createChannel(client: Socket, payload: IChannel) {

    const newChannel = await this.channnelService.createChannel(payload, client.data.user);

    if (newChannel)
      this.sendCreatedRoom(client, newChannel)
    else
      throw new WsException('Problem while creating the new room');
  }

  @SubscribeMessage('createPrivateMessage')
  async createPrivateMessage(client: Socket, userName42: string) {
    const otherUser = await this.userService.getByLogin42(userName42);
    if (!otherUser)
      this.server.to(client.id).emit('createPrivateMessageResponse', 'false');

    const newChannel = await this.channnelService.createPrivateMessage(client.data.user, otherUser);

    if (newChannel){
      this.server.to(client.id).emit('createPrivateMessageResponse', 'true');
      this.sendCreatedRoom(client, newChannel);
    }
    else
      this.server.to(client.id).emit('createPrivateMessageResponse', 'exist');
  }


  @SubscribeMessage('joinRoom')
  async joinChannel(client: Socket, payload: any) {
    const banned: boolean = await this.channnelService.checkIfBaned(payload, client.data.user)
    if (banned == true){
      this.server.to(client.id).emit('joinRoomResponse', 'ban');
      return;
    }
    const tempChannel = await this.channnelService.joinChannel(payload, client.data.user);
    if (tempChannel){
        this.server.to(client.id).emit('joinRoomResponse', 'true');
        this.sendUpdateChannels(client);     
    }
    else
      this.server.to(client.id).emit('joinRoomResponse', 'false');
  }



  @SubscribeMessage('leaveRoom')
  async leaveChannel(client: Socket, payload: any) {
    const tempChannel = await this.channnelService.leaveChannel(payload, client.data.user);
    if (tempChannel)
      this.sendUpdateChannels(client);
  }

  @SubscribeMessage('deleteRoom')
  async deleteChannel(client: Socket, payload: any) {
    await this.channnelService.deleteChannel(payload, client.data.user);
    this.sendUpdateChannels(client);
  }

  @SubscribeMessage('deletePrivateMessage')
  async deletePrivateMessage(client: Socket, payload: any) {
    const channel = await this.channnelService.getChannelByName(payload.name);
    //
    //   TO DO DEMAIN MATIN
    //
    await this.channnelService.deleteChannel(payload, client.data.user);
    this.sendUpdatePrivateMessages(client, channel);
  }

  @SubscribeMessage('message')
  async onNewMessage(client: Socket, msg: IMessage){

    const muted: boolean = await this.channnelService.checkIfMuted(msg.channel, client.data.user)
    console.log(`THE VALUE OF MUTED IS ${muted}`)
    if (muted == true){
      
      this.server.to(client.id).emit('messageResponse', 'muted');
      return;
    }
    else {
      console.log(msg);
      msg.user = client.data.user;
      const newMsg = await this.messageService.createMessage(msg);

      console.log("LOG OF NEW MSG");
      console.log(newMsg);

      this.server.to(client.id).emit('messageResponse', 'unmuted');
      this.sendMessage(client, newMsg);
    }
  }

  private async sendMessage(client: Socket, message){

    const channel = message.channel;
    for ( const user of channel.users){
      const connections: IConnection[] = await this.connectionService.findByUserId(user.id);
      for (const connection of connections){
        this.server.to(connection.socket).emit('msgToClient', message);
      }
    }   
  }

  private async sendAllert(userId: number, message: string, event: string){
      const connections: IConnection[] = await this.connectionService.findByUserId(userId);
      for (const connection of connections){
        this.server.to(connection.socket).emit(event, message);
      }    
  }

  // @SubscribeMessage('deleteMessage')
  // async deleteMessage(client: Socket, payload){
  //   const user = client.data.user;
  //   const channel = await this.channnelService.getChannelByName(payload.channelName);
  //   if (channel.channelAdminsId.find(nbr => nbr === user.id) !== undefined)
      
  // }

  @SubscribeMessage('muteUser')
  async muteUser(client: Socket, payload){
    const admin = client.data.user;
    const channel = await this.channnelService.getChannelByName(payload.channel);
    const user = await this.userService.getByLogin42(payload.userName42);
    
    if (!channel || !user){
      this.server.to(client.id).emit('muteUserResponse', 'false');
      return;
    }
    if ((admin.id === channel.channelOwnerId) || (channel.channelAdminsId.find(nbr => nbr === admin.id) !== undefined)){
      const tmpMute = await this.channnelService.muteUser(channel, user, payload.minutes);
      if (!tmpMute){
        this.server.to(client.id).emit('muteUserResponse', 'muted');
        return;
      }
      this.server.to(client.id).emit('muteUserResponse', 'true');
      this.sendUpdateChannels(client);
    }
    else
      this.server.to(client.id).emit('muteUserResponse', 'false');
  }

  @SubscribeMessage('banUser')
  async banUser(client: Socket, payload){
    const admin = client.data.user;
    const channel = await this.channnelService.getChannelByName(payload.channel);
    const user = await this.userService.getByLogin42(payload.userName42);
    
    if (!channel || !user){
      this.server.to(client.id).emit('banUserResponse', 'false');
      return;
    }

    if ((admin.id === channel.channelOwnerId) || (channel.channelAdminsId.find(nbr => nbr === admin.id) !== undefined)){
      const tmpBan = await this.channnelService.banUser(channel, user, payload.minutes);
      if (!tmpBan){
        this.server.to(client.id).emit('banUserResponse', 'banned');
        return;
      }
      this.server.to(client.id).emit('banUserResponse', 'true');
      await this.sendAllert(user.id, channel.name, 'youHaveBeenBanned');
      await this.sendUpdateChannels(client);
    }
    else
      this.server.to(client.id).emit('banUserResponse', 'false');
  }
/////////

  @SubscribeMessage('kickUser')
  async kickUser(client: Socket, payload){
    const admin = client.data.user;
    const channel = await this.channnelService.getChannelByName(payload.channel);
    const user = await this.userService.getByLogin42(payload.userName42);
    
    if (!channel || !user){
      this.server.to(client.id).emit('kickUserResponse', 'false');
      return;
    }

    if ((admin.id === channel.channelOwnerId) || (channel.channelAdminsId.find(nbr => nbr === admin.id) !== undefined)){
      const tmpKick = await this.channnelService.kickUser(channel, user, payload.minutes);
      if (!tmpKick){
        this.server.to(client.id).emit('kickUserResponse', 'banned');
        return;
      }
      this.server.to(client.id).emit('kickUserResponse', 'true');
      await this.sendAllert(user.id, channel.name, 'youHaveBeenKicked');
      await this.sendUpdateChannels(client);
    }
    else
      this.server.to(client.id).emit('kickUserResponse', 'false');
  }

/////////


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
