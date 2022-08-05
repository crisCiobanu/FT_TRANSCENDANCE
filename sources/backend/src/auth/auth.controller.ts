import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import passport from 'passport';
import { Response, Request} from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { FourtyTwoGuard } from './fourty-two.guard';
import { JwtGuard } from './jwt.guard';
import { UsersService } from 'src/users/users.service';
import { MyMailService } from './mail.service';
import { User } from 'src/users/user.entity';
import SmsService from './sms.service';


@Controller('auth')
export class AuthController {

    constructor (private authService: AuthService, 
                private userService: UsersService,
                private mailService: MyMailService,
                private smsService: SmsService) {}

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
    
    @Get('activation/:code')
    @UseGuards(JwtGuard)
    async activateUser(@Param('code') parameter : string, @Res({passthrough: true}) res: Response, @Req() req: any) {
        if (this.authService.activateUser(req.user.email, parameter))
            res.status(HttpStatus.OK).send();
        else
            res.status(HttpStatus.NO_CONTENT);

    }

    @Get('currentuser')
    @UseGuards(JwtGuard)
    async getCurrentUser(@Res({passthrough: true}) res: Response, @Req() req: any) {
        //console.log(req);
        return this.userService.getByLogin42(req.user.userName42);
        //return req.user;
    }

    @Post('initiate-verification')
    //@UseGuards(JwtGuard)

    async initiatePhoneNumberVerification(@Body() body: any) {
    //   if (req.user.isPhoneNumberConfirmed) {
    //     throw new BadRequestException('Phone number already confirmed');
    //   }
        console.log(`The phone number is : ${body.phoneNumber}`);
      await this.smsService.initiatePhoneNumberVerification(body.phoneNumber);
    }

}
