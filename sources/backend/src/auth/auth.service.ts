import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import User from 'src/users/user.entity';
import { Profile } from 'passport-42';
import {v4 as uuidv4} from 'uuid';
import { AuthenticationProvider } from './auth';


@Injectable()
export class AuthService implements AuthenticationProvider{


    constructor(private userService: UsersService,
                private jwtService: JwtService){}
    // async login(userDto: CreateUserDto){
    //     const user = await this.validateUser(userDto);
    //     return this.generateToken(user);
    // }
    
    // async registration(userDto: CreateUserDto){
    //     const candidate = await this.userService.getByEmail(userDto.email);
    //     if (candidate)
    //         throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    //     const hashPass = await bcrypt.hash(userDto.password, 5);
    //     const user = await this.userService.create({...userDto, password: hashPass});
    //     return this.generateToken(user);
    // }

    async generateToken(user : User){
        const payload = {email: user.email, id: user.id};
        console.log(user.email + ' '+ user.id);
        return this.jwtService.sign(payload);
    }

    // private async validateUser(userDto: CreateUserDto){
    //     const user = await this.userService.getByEmail(userDto.email);
    //     const passEqual = await bcrypt.compare(userDto.password, user.password);
    //     if (user && passEqual)
    //         return user;
    //     throw new UnauthorizedException('Login or password are wrong');

    // }


async validateUser(user: CreateUserDto){
        const tmpUser = await this.userService.getByLogin42(user.userName42);

        if (tmpUser) 
            return tmpUser;
        else
          return this.userService.create(user);
}

async activateUser(userName42: string, code: string){
    const tmpUser = await this.userService.getByLogin42(userName42);
    if (tmpUser.activationLink == code) {
        return true;
    }
    else
        return false;
}
    createUser(details: CreateUserDto){

    }
    findUser(userName42: string): Promise<User | undefined>{
        return this.userService.getByLogin42(userName42)
    }

//     async validateUser(profile : Profile){
//         const tmpUser = await this.userService.getByEmail(profile.email);

//         if (tmpUser){   
//             return tmpUser;
//         }
//         else
//         {
//           const activLink = uuidv4();
//           const newUser: CreateUserDto = { email: profile.email, 
//                                           userName: profile.login,
//                                           firstName: profile.first_name,
//                                           lastName: profile.last_name,
//                                           password: '',
//                                           imageURL: profile.image_url,
//                                           activationLink: activLink
//                                         };
//           return this.userService.create(newUser);
//     }
// }
}
