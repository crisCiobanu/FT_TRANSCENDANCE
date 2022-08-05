import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import passport from 'passport';
import { Response, Request} from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { FourtyTwoGuard } from './fourty-two.guard';
import { JwtGuard } from './jwt.guard';
import { UsersService } from 'src/users/users.service';
import { MyMailService } from './mail.service';
import User from 'src/users/user.entity';


@Controller('auth')
export class AuthController {

    constructor (private authService: AuthService, 
                private userService: UsersService,
                private mailService: MyMailService) {}

    // @Post('/login')
    // login(@Body() userDto: CreateUserDto){
    //     return this.authService.login(userDto);
    // }

    // @Post('/registration')
    // registration(@Body() userDto: CreateUserDto){
    //     return this.authService.registration(userDto);
    // }


    @Get('42')
    @UseGuards(FourtyTwoGuard)
    authentificate(){
    }

    @Get('redirect')
	@UseGuards(FourtyTwoGuard)
	async redirect(@Res({passthrough: true}) res: Response, @Req() req: any) {
		const accessToken = await this.authService.generateToken(req.user);

        console.log(accessToken);

        if (req.user.TWOFA)
            await this.mailService.sendActivationMail(req.user.email, req.user.activationLink);

        res.cookie('access_token', accessToken, {
            path: "/",
            httpOnly: false,
            //hostOnly: false,
         //   domain: "http://localhost/"
          });
		res.status(HttpStatus.FOUND).redirect(process.env.FRONTEND_URL);
	}   
    
    @Get('activation/:link')
    findById(@Param('link') parameter : string) {
        console.log(parameter);
    }

    @Get('currentuser')
    @UseGuards(JwtGuard)
    async getCurrentUser(@Res({passthrough: true}) res: Response, @Req() req: any) {
        console.log(req);
        return this.userService.getByEmail(req.user.email);
        //return req.user;
    }
}
