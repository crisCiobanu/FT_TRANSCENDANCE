import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UploadImageDto } from './dto/image-upload.dto';
import { Profile } from 'passport-42';
import User from './user.entity';
import {v4 as uuidv4} from 'uuid';

@Injectable()
export class UsersService {
    private users = [];

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}  

    async create(createUserDto : CreateUserDto): Promise<User>{
        const newUser = await this.userRepository.create(createUserDto);
        await this.userRepository.save(newUser);
        return newUser;
    }

    async getAll() : Promise<User[]>{
        return this.userRepository.find();
    }

    async getById(id : number) : Promise<User>{
        return this.userRepository.findOneBy( {id} );
    }

    async delete(id: number) : Promise<void>{
        await this.userRepository.delete(id);
    }

    async getByLogin42(userName42 : string) : Promise<User>{
        return this.userRepository.findOneBy( {userName42} );
    }

    async changeUserName(id: number, userName: string): Promise<User>{
        const newUser = await this.userRepository.findOneBy({ id });
        newUser.userName = userName;
        await this.userRepository.save(newUser);
        return newUser;
    }

    async changeUserEmail(id: number, email: string): Promise<User>{
        const newUser = await this.userRepository.findOneBy({ id });
        newUser.email = email;
        await this.userRepository.save(newUser);
        return newUser;
    }

    async changeUserImage(id: number, imageURL: string): Promise<User>{
        const newUser = await this.userRepository.findOneBy({ id });
        newUser.imageURL = imageURL;
        await this.userRepository.save(newUser);
        return newUser;
    }

    async changeTWOFA(email: string): Promise<User>{
        const newUser = await this.userRepository.findOneBy({ email });
        newUser.TWOFA = !(newUser.TWOFA);
        await this.userRepository.save(newUser);
        return newUser;
    }

    async uploadFile(id : number, uploadImageDto: UploadImageDto) {

    }

//     async validateUser(profile : Profile){
//         const tmpUser = await this.getByEmail(profile.email);

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
//           return this.create(newUser);

//     }
// }
    // async findUserinDb(email : string) : Promise<User>{
    //     const tmpUser = this.getByEmail(email);
    //     if (tmpUser)
    //         return tmpUser;
        

 //   }

}
