import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';
import { PongController } from './pong.controller';
import { GameService } from './game/game.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [PongGateway, PongService, GameService],
  controllers: [PongController]
})
export class PongModule {}
