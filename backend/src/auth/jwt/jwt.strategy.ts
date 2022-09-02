
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
      private readonly configService: ConfigService
  ) {
    super({
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
     jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    });
  }

  async validate(payload: any) {
    console.log(payload);
    return { userName42: payload.userName42, userid: payload.id };
  }
}