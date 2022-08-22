import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { OnlineGateway } from './online.gateway';

@Module({
  imports: [UsersModule, AuthModule],
  providers: [OnlineGateway]
})
export class OnlineModule {}
