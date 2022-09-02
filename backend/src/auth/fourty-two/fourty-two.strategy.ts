
import { Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, Profile } from 'passport-42'
import { CreateUserDto } from "src/users/dto/create-user.dto";
import User from "src/users/user.entity";
import { UsersService } from "src/users/users.service";
import { AuthenticationProvider } from "../auth";
import { AuthService } from "../auth.service";
import {v4 as uuidv4} from 'uuid';


export class FourtyTwoStrategy extends PassportStrategy(Strategy) {
    constructor( 
    @Inject('AUTH_SERVICE')
    private readonly authService: AuthenticationProvider) {
        super({
            clientID: process.env.FOURTYTWO_ID,
            clientSecret: process.env.FOURTYTWO_SECRET,
            callbackURL: `${process.env.BACKEND_URL}${process.env.FOURTYTWO_REDIRECT_URL}`,
            scope: ['public'],
            profileFields: {
                'username': 'login',
                'displayName': 'displayname',
                'name.familyName': 'last_name',
                'name.givenName': 'first_name',
                'emails.0.value': 'email',
                'photos.0.value': 'image_url'
              }
        }
        )
    }

    async validate(access_token: string, refresh_token: string, user: Profile) : Promise<User>{
        const activLink = uuidv4().slice(0, 6);
        console.log("LOG FROM VALIDATE FUNCTION")
        const newUser: CreateUserDto = { email: user['emails'][0]['value'] , 
            userName: user.username,
            userName42: user.username,
            firstName: user.name.givenName,
            lastName: user.name.familyName,
            password: '',
            imageURL: user['photos'][0]['value'],
            activationLink: activLink,
            blocked: [],
            friends: []
          };

        return this.authService.validateUser(newUser);
    }
}

