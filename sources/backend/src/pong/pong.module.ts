import { Module } from '@nestjs/common';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';
import { PongController } from './pong.controller';
import { GameService } from './game/game.service';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchService } from './match/match.service';
import { MatchController } from './match/match.controller';
import { Match } from './match/match.entity';

@Module({
  imports: [UsersModule, AuthModule, ScheduleModule.forRoot(), TypeOrmModule.forFeature([Match])],
  providers: [PongGateway, PongService, GameService, MatchService],
  controllers: [PongController, MatchController]
})
export class PongModule {}
