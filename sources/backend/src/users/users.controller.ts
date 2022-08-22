import { Body, Controller, Delete, Get, Res, Header, HttpCode, HttpStatus, Param, Post, Redirect, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { Request } from 'express';
import { runInThisContext } from 'vm';
import { JwtGuard } from 'src/auth/jwt/jwt.guard';
import { CreateUserDto } from './dto/create-user.dto';
import User from './user.entity';
import { UsersService } from './users.service';
import * as FormData from 'form-data';
import { UpdateUserEmailDto, UpdateUserNameDto } from './dto/update-user-name.dto';
import { UpdateUserImageDto } from './dto/update-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {diskStorage} from 'multer';
import {v4 as uuidv4} from 'uuid'
import { MyMailService } from 'src/auth/mail.service';

@Controller('users')
export class UsersController {

    constructor (private userService : UsersService, private mailService: MyMailService) {
    }

    @Post('updateusername')
    @UseGuards(JwtGuard)
    updateUser(@Body() updateUser : UpdateUserNameDto){
        return this.userService.changeUserName(updateUser.id, updateUser.username);
    }

    @Post('updatemail')
    @UseGuards(JwtGuard)
    updateEmail(@Res({passthrough: true}) res: Response, @Req() req: any){
        return this.userService.changeUserEmail(req.user.userName42, req.body.email);
    }

    @Post('ban')
    banUser(){

    }

    @Post('unban')
    unbanUser(){

    }

    
    @Post('updateimage')
    //@UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor('file', {
      storage: diskStorage({
        destination: './public',
        filename: function(req, file, cb){
          cb(null, file.originalname)
        }
      })
    }))
    uploadFile(@Req() request: UpdateUserImageDto, @UploadedFile() file: Express.Multer.File, @Res() res ){
    console.log(file);
    this.userService.changeUserImage(request.id, `http://localhost:3000/public/${file.filename}`);
    return (res.status(HttpStatus.OK).send(JSON.stringify({url: `http://localhost:3000/public/${file.filename}`})));

    }

    //@UseGuards(JwtGuard)
    @Get()
    findAll() : Promise<User[]>{
        return this.userService.getAll();
    }

    @Post('twofa')
    @UseGuards(JwtGuard)
    twofa(@Res({passthrough: true}) res: Response, @Req() req: any) : Promise<User>{
        console.log(`LOG FROM TWOFA CONTROLLER : `);
        console.log(req.user);
        return this.userService.changeTWOFA(req.user.userName42);
    }

    @Post('block')
    @UseGuards(JwtGuard)
    block(@Res({passthrough: true}) res: Response, @Req() req: any) : Promise<User>{
        return this.userService.blockUser(req.user.email, req.body.id);
    }

    @Post('unblock')
    @UseGuards(JwtGuard)
    unblock(@Res({passthrough: true}) res: Response, @Req() req: any) : Promise<User>{
        console.log(req.user.userName42);
        return this.userService.unBlockUser(req.user.userName42, req.body.id.toString());
    }

    @Post('friends')
    @UseGuards(JwtGuard)
    friend(@Res({passthrough: true}) res: Response, @Req() req: any) : Promise<User>{
        return this.userService.makeFriend(req.user.userName42, req.body.id);
    }

    @Post('unfriend')
    @UseGuards(JwtGuard)
    unfriend(@Res({passthrough: true}) res: Response, @Req() req: any) : Promise<User>{
        return this.userService.removeFriend(req.user.userName42, req.body.id);
    }

    @Get(':id')
    async findById(@Param('id') parameter : number) : Promise<User>{
        console.log('HERE');
        console.log(parameter);
        const user: User = await this.userService.getById(parameter);
        //console.log(user.matches);
        return user;
    }

    @Delete(':id')
    deleteById(@Param('id') parameter: number) : Promise<void>{
        console.log('Trying to delete : ' + parameter);
        return this.userService.delete(parameter);
    }

   
}
