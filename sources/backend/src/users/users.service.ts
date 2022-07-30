import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import User from './user.entity';

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

    async getByEmail(email : string) : Promise<User>{
        return this.userRepository.findOneBy( {email} );
    }

    async changeUserName(id: number, userName: string): Promise<User>{
        const newUser = await this.userRepository.findOneBy({ id });
        newUser.userName = userName;
        await this.userRepository.save(newUser);
        return newUser;
    }

    async changeUserImage(id: number, imageURL: string): Promise<User>{
        const newUser = await this.userRepository.findOneBy({ id });
        newUser.imageURL = imageURL;
        await this.userRepository.save(newUser);
        return newUser;
    }

    // async findUserinDb(email : string) : Promise<User>{
    //     const tmpUser = this.getByEmail(email);
    //     if (tmpUser)
    //         return tmpUser;
        

 //   }

}
