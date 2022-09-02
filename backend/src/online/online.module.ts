import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { HomeGateway } from './home.gateway';
import { OnlineGateway } from './online.gateway';
import { ProfileGateway } from './profile.gateway';


@Module({
  imports: [UsersModule, AuthModule],
  providers: [OnlineGateway, ProfileGateway, HomeGateway]
})
export class OnlineModule {}
