import { Body, Controller, Delete, Get, Res, Header, HttpCode, HttpStatus, Param, Post, Redirect, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { runInThisContext } from 'vm';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CreateUserDto } from './dto/create-user.dto';
import User from './user.entity';
import { UsersService } from './users.service';
import * as FormData from 'form-data';

@Controller('users')
export class UsersController {

    constructor (private userService : UsersService) {
    }

    @Post('callback')
    async login(@Res() res, @Req() req) {
        console.log("A");
      const code = req.body.access_token;

      if (code) {
        console.log(code);
      }

      const formData= new FormData();
      console.log("B");
      formData.append('grant_type', 'authorization_code');
      formData.append('client_id', '3e6e67d52700f32ea72111aee9b04403f78ba98745a76856cf11003de9399fa2');
      formData.append('client_secret', 'e5165b87afe9711afb6b729e50a10a6ea220a05524e1b48dc318951c9edb3d8a');
       formData.append('code', code);
       formData.append('redirect_uri', 'http://localhost:8080/');
       console.log("C");
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
        //console.log(profile);
        //if (profile,first_name && profile.last_name);
        //return database profile;
        const tmpUser = await this.userService.getByEmail(profile.email);
        if (tmpUser)
          return (res.status(HttpStatus.OK).send(JSON.stringify(tmpUser)));
        else
        {
          const newUser: CreateUserDto = { email: profile.email, 
                                          userName: profile.login,
                                          firstName: profile.first_name,
                                          lastName: profile.last_name,
                                          password: '',
                                          imageURL: profile.image_url,
                                        };
          return this.userService.create(newUser);

        }
        
        // return (res.status(HttpStatus.OK).send(JSON.stringify({
        //   username: profile.login,
        //   firstname: profile.first_name,
        //   lastname: profile.last_name,
        //   image_url: profile.image_url, 
        //   logged: 'true',
        //   wins: 4,
        //   losses: 2,
        //   level: 1.5,
  
        // })))
    }

    @Post(':id')
    create(@Body() createUserDto : CreateUserDto, @Param('id') par : number) : Promise<User>{
        return this.userService.create(createUserDto);
    }

    @UseGuards(JwtGuard)
    @Get()
    findAll() : Promise<User[]>{
        return this.userService.getAll();
    }

    @Get(':id')
    findById(@Param('id') parameter : number) : Promise<User>{
        console.log(parameter);
        return this.userService.getById(parameter);
    }

    @Delete(':id')
    deleteById(@Param('id') parameter: number) : Promise<void>{
        console.log('Trying to delete : ' + parameter);
        return this.userService.delete(parameter);
    }

   
}
