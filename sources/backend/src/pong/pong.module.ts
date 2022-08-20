import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';
import { PongController } from './pong.controller';
import { GameService } from './game/game.service';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinishedgameService } from './finishedgame/finishedgame.service';
import { FinishedgameController } from './finishedgame/finishedgame.controller';

@Module({
  imports: [UsersModule, AuthModule, ScheduleModule.forRoot(), TypeOrmModule.forFeature([])],
  providers: [PongGateway, PongService, GameService, FinishedgameService],
  controllers: [PongController, FinishedgameController]
})
export class PongModule {}
