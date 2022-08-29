import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from 'src/users/user.entity';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FourtyTwoStrategy } from './fourty-two/fourty-two.strategy';
import { JwtGuard } from './jwt/jwt.guard';
import { JwtStrategy } from './jwt/jwt.strategy';
import { MyMailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer'
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  controllers: [AuthController],
  providers: [AuthService, 
              FourtyTwoStrategy,
              JwtStrategy,
              MyMailService,
              {
                provide: 'AUTH_SERVICE',
                useClass: AuthService,
              }
            ],
  imports: [
    ConfigModule,
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION')
      }})
      } 
    ),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.zoho.eu',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
    }),
    TypeOrmModule.forFeature([User])
  ],
  exports: [
    MyMailService,
    JwtModule,
    AuthService,
    {
      provide: 'AUTH_SERVICE',
      useClass: AuthService,
    },
  ]

})
export class AuthModule {}
