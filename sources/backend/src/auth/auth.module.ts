import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from 'src/users/user.entity';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FourtyTwoStrategy } from './fourty-two.strategy';
import { JwtGuard } from './jwt.guard';
import { JwtStrategy } from './jwt.strategy';
import { MailService } from './mail.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, 
              FourtyTwoStrategy,
              JwtStrategy,
              MailService,
              {
                provide: 'AUTH_SERVICE',
                useClass: AuthService,
              }
            ],
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.register({
      secret: 'asdfgh',
      signOptions: {
        expiresIn: '7d'
      }
    }  
    ),
    TypeOrmModule.forFeature([User])
  ],
  exports: [
    MailService,
    JwtModule,
    {
      provide: 'AUTH_SERVICE',
      useClass: AuthService,
    },
  ]

})
export class AuthModule {}
