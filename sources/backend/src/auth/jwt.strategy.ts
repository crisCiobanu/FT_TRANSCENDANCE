
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      ignoreExpiration: false,
      secretOrKey: 'asdfgh',
     jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

    //   jwtFromRequest:ExtractJwt.fromExtractors([(request:Request) => {
    //     let data = request?.cookies["auth-cookie"];
    //     //console.log(`REQUEST IS : ${request}`);
    //     console.log(request);
    //     console.log(`ACCESS TOKEN IS : ${data}`);
    //     if(!data){
    //         return null;
    //     }
    //     return data.token
    // }])
    });
  }

  async validate(payload: any) {
    console.log(payload);
    return { email: payload.email, userid: payload.id };
  }
}