import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import passport from 'passport';
import { Response, Request} from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { FourtyTwoGuard } from './fourty-two/fourty-two.guard';
import { JwtGuard } from './jwt/jwt.guard';
import { UsersService } from 'src/users/users.service';
import { MyMailService } from './mail.service';
import { User } from 'src/users/user.entity';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {

    constructor (private authService: AuthService, 
                private userService: UsersService,
                private mailService: MyMailService,
                private configService: ConfigService
            ) {}

    @Get('42')
    @UseGuards(FourtyTwoGuard)
    authentificate(){
    }

    @Get('redirect')
	@UseGuards(FourtyTwoGuard)
	async redirect(@Res({passthrough: true}) res: Response, @Req() req: any) {
		const accessToken = await this.authService.generateToken(req.user);

        console.log(accessToken);

        if (req.user.TWOFA){
            const newUser = await this.userService.refreshActivationCode(req.user.userName42)
            await this.mailService.sendActivationMail(newUser.email, newUser.activationLink);
        }

        res.cookie('access_token', accessToken, {
            path: "/",
            httpOnly: false,
          });
		res.status(HttpStatus.FOUND).redirect(this.configService.get('FRONTEND_URL'));
	}   
    
    @Get('activation/:code')
    @UseGuards(JwtGuard)
    async activateUser(@Param('code') parameter : string, @Res({passthrough: true}) res: Response, @Req() req: any) {
        console.log("Avtivation code is : " + parameter);
        if (await this.authService.activateUser(req.user.userName42, parameter))
            res.status(HttpStatus.OK).send();
        else
            res.status(HttpStatus.NO_CONTENT).send();

    }

    @Get('currentuser')
    @UseGuards(JwtGuard)
    async getCurrentUser(@Res({passthrough: true}) res: Response, @Req() req: any) {
        return this.userService.getByLogin42(req.user.userName42);
    }


}
