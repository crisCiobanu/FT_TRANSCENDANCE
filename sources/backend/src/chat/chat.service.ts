import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { Socket } from 'socket.io';
import User from 'src/users/user.entity';

@Injectable()
export class ChatService {
    constructor(
        private readonly authService: AuthService
      ){}

      async getUserFromSocket(socket: Socket) : Promise<User>{
        const token = socket.handshake.auth.token;
        if (!token)
            throw new UnauthorizedException;
        const user = await this.authService.getUserFromToken(token);
        if (!user)
            throw new UnauthorizedException;
        return user;
      }

}
