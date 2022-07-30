import { Body, Controller, Delete, Get, Res, Header, HttpCode, HttpStatus, Param, Post, Redirect, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { Request } from 'express';
import { runInThisContext } from 'vm';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CreateUserDto } from './dto/create-user.dto';
import User from './user.entity';
import { UsersService } from './users.service';
import * as FormData from 'form-data';
import { UpdateUserNameDto } from './dto/update-user-name.dto';
import { UpdateUserImageDto } from './dto/update-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {diskStorage} from 'multer';

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
    }

    // @Post(':id')
    // create(@Body() createUserDto : CreateUserDto, @Param('id') par : number) : Promise<User>{
    //     return this.userService.create(createUserDto);
    // }

    @Post('updateusername')
    updateUser(@Body() updateUser : UpdateUserNameDto){
        return this.userService.changeUserName(updateUser.id, updateUser.username);
    }

    // @Post('updateimage')
    // updateUserImage(@Body() updateUser : UpdateUserImageDto){
    //     return this.userService.changeUserImage(updateUser.id, updateUser.imageURL);
    // }

    // @Post('updateimage')
    // @UseInterceptors(FileInterceptor('file', {
    //   storage: diskStorage({
    //     destination: './avatars',
    //     filename: function(req, file, cb){
    //       cb(null, file.originalname)
    //     }
    //   })
    // }))
    // async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // console.log(file);
    // return "FILE UPLOAD SUCCEDED";
    // }
    
    @Post('updateimage')
    @UseInterceptors(FileInterceptor('file', {
      storage: diskStorage({
        destination: './avatars'
      })
    }))
    uploadFile(@Req() request: UpdateUserImageDto, @UploadedFile() file: Express.Multer.File, @Res() res ){
    console.log(file);
    // this.userService.changeUserImage(request.id, `/avatars/${file.filename}`);
    this.userService.changeUserImage(request.id, "/img/pong.svg");
    //return `/avatars/${file.filename}`;
    return (res.status(HttpStatus.OK).send(JSON.stringify({url: "/img/pong.svg"})));
   
    


    // return this.userService.uploadFile(request.id, {
    //   path: file.path,
    //   filename: file.originalname,
    //   mimetype: file.mimetype
    // });
    }

    //@UseGuards(JwtGuard)
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
