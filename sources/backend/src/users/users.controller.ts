import { Body, Controller, Delete, Get, Res, Header, HttpCode, HttpStatus, Param, Post, Redirect, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { Request, Response } from 'express';
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
import { ConfigService } from '@nestjs/config';

@Controller('users')
export class UsersController {

    constructor (private readonly userService : UsersService, 
                private readonly mailService: MyMailService,
                private readonly configService: ConfigService) {
    }

    @Post('updateusername')
    @UseGuards(JwtGuard)
    async updateUser(@Res({passthrough: true}) res: Response, 
                    @Req() req: any,
                    @Body() body: UpdateUserNameDto){
    //console.log("LOG FROM UPDATE USERNAME");
    //console.log(req.body);
    const user = await this.userService.getByUserName(body.username);
    //console.log(user);
        if (user){
            //console.log("LOG FROM UPDATE USERNAME    KO ");
            res.status(HttpStatus.OK).send({status: 'KO'});
        } else {
            //console.log("LOG FROM UPDATE USERNAME    ok");
            await this.userService.changeUserName(req.user.id, body.username);
            res.status(HttpStatus.OK).send({status: 'OK'});
        }

    }

    @Post('updatemail')
    @UseGuards(JwtGuard)
    async updateEmail(@Req() req: any, @Body() body : UpdateUserEmailDto){
        return this.userService.changeUserEmail(req.user.userName42, body.email);
    }

    @Post('logout')
    @UseGuards(JwtGuard)
    onLogout(@Req() req: any){
        return this.userService.logOut(req.user.userName42);
    }

    // @Post('ban')
    // banUser(){

    // }

    // @Post('unban')
    // unbanUser(){

    // }

    
    @Post('updateimage')
    @UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor('file', {
      storage: diskStorage({
        destination: './public',
        filename: function(req, file, cb){
          cb(null, file.originalname)
        }
      }),
      fileFilter: function(req, file, cb){
        if (file.mimetype === "image/png" ||
            file.mimetype === "image/jpg" ||
            file.mimetype === "image/jpeg"){
                cb(null, true);
            }
        else {
                cb(null, false);
        }
      }
    }))
    uploadFile(@Req() request, @UploadedFile() file: Express.Multer.File, @Res() res ){
    // console.log(file);
    // console.log("LOG FROM UPDATE IMAGE")
    // console.log(request.user);
    this.userService.changeUserImage(request.user.userName42, `${this.configService.get('BACKEND_URL')}/public/${file.filename}`);
    return (res.status(HttpStatus.OK).send(JSON.stringify({url: `${this.configService.get('BACKEND_URL')}/public/${file.filename}`})));

    }

    
    @Get()
    @UseGuards(JwtGuard)
    findAll() : Promise<User[]>{
        return this.userService.getAll();
    }

    @Post('twofa')
    @UseGuards(JwtGuard)
    twofa(@Req() req: any) : Promise<User>{
        console.log(`LOG FROM TWOFA CONTROLLER : `);
        console.log(req.user);
        return this.userService.changeTWOFA(req.user.userName42);
    }

    @Post('block')
    @UseGuards(JwtGuard)
    block(@Req() req: any) : Promise<User>{
        console.log("LOG FROM BLOCK USER");
        console.log(req.body);
        return this.userService.blockUser(req.user.userName42, req.body.id);
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
        // console.log('HERE');
        // console.log(parameter);
        const user: User = await this.userService.getById(parameter);
        //console.log(user.matches);
        return user;
    }

    @Delete(':id')
    deleteById(@Param('id') parameter: number) : Promise<void>{
        // console.log('Trying to delete : ' + parameter);
        return this.userService.delete(parameter);
    }

   
}
