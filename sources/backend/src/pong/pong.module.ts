import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';
import { PongController } from './pong.controller';
import { GameService } from './game/game.service';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [UsersModule, AuthModule, ScheduleModule.forRoot()],
  providers: [PongGateway, PongService, GameService],
  controllers: [PongController]
})
export class PongModule {}
