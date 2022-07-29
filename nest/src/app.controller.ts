import { Controller, Get, Post, Body, Param, Res, Req, Ip, HttpStatus } from '@nestjs/common';
import { runInThisContext } from 'vm';
import { AppService } from './app.service';
import * as FormData from 'form-data';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  
  @Get('player')
  getPlayer(): any {
    return this.appService.getPlayer();
  }
  @Get('isAuth')
  getAuth(): any {
    return this.appService.getAuth() ;
  }

  @Post('login')
  getLogin() :any {
    return this.appService.getLogin();
  }

  @Post('callback')
  async login(@Res() res, @Req() req) {
    const code = req.body.access_token;
    if (code) {
      console.log(code);
    }
    const formData= new FormData();

    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', '3e6e67d52700f32ea72111aee9b04403f78ba98745a76856cf11003de9399fa2');
    formData.append('client_secret', 'e5165b87afe9711afb6b729e50a10a6ea220a05524e1b48dc318951c9edb3d8a');
     formData.append('code', code);
     formData.append('redirect_uri', 'http://localhost:8080/');
    const api = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'post',
      headers: {
        ...formData.getHeaders(),
        },
        body: formData.getBuffer().toString(),
  
      });
   console.log(api.status);
    const {access_token: token, refresh_token: refresh_token} =
            await api.json();
    console.log(token);
    const profile = await fetch('https://api.intra.42.fr/v2/me', {
          headers: {
              'Authorization': `Bearer ${token}`,
          },
      }).then(response => response.json());
      console.log(profile.first_name);
      //if (profile,first_name && profile.last_name);
      //return database profile;
      
      return (res.status(HttpStatus.OK).send(JSON.stringify({
        username: profile.login,
        firstname: profile.first_name,
        lastname: profile.last_name,
        image_url: profile.image_url, 
        logged: 'true',
        wins: 4,
        losses: 2,
        level: 1.5,

      })))
  }

  @Get('protected')
  getHello(): string {
    return this.appService.getHello();
  }
}
