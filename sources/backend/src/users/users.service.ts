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

    async create(createUserDto : CreateUserDto){
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

    // async findUserinDb(email : string) : Promise<User>{
    //     const tmpUser = this.getByEmail(email);
    //     if (tmpUser)
    //         return tmpUser;
        

 //   }

}
