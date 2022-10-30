import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UploadImageDto } from './dto/update-image.dto';
import { Profile } from 'passport-42';
import { ChannelService } from '../chat/channel/channel.service'
import { IMatch } from '../pong/match/match.interface';
import {User, UserState} from './user.entity';
import {v4 as uuidv4} from 'uuid';

@Injectable()
export class UsersService {
    private users = [];

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}  

    async create(createUserDto : CreateUserDto): Promise<User>{
        let newUser = await this.userRepository.create(createUserDto);
        newUser = await this.userRepository.save(newUser);
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
        
        //const user = await this.userRepository.findOneBy( {userName42} );
        const user = await this.userRepository.findOne({
            where: {
                userName42: userName42
            }
        })
        // console.log("LOG FROM GET BY USERNAME42");
        // console.log(user);
        return user;
    }

    async getByUserName(userName : string) : Promise<User>{
        return this.userRepository.findOneBy( {userName} );
    }

    async logOut(userName42: string): Promise<User>{
        let user = await this.userRepository.findOneBy({userName42});
        if (!user)
            return null;
        user.state = UserState.OFFLINE;
        return this.userRepository.save(user); 
    }

    async changeUserName(userName42: string, userName: string): Promise<User>{
        let newUser = await this.userRepository.findOneBy({ userName42 });
        newUser.userName = userName;
        newUser = await this.userRepository.save(newUser);
        return newUser;
    }

    async changeUserEmail(userName42: string, email: string): Promise<User>{
        let newUser = await this.userRepository.findOneBy({ userName42 });
        newUser.email = email;
        newUser.ownMail = true;
        newUser = await this.userRepository.save(newUser);
        return newUser;
    }

    async changeUserImage(userName42: string, imageURL: string): Promise<User>{
        let newUser = await this.userRepository.findOneBy({ userName42 });
        // console.log("LOG FROM CHANGE USER IMAGE")
        // console.log(imageURL);
        newUser.imageURL = imageURL;
        newUser = await this.userRepository.save(newUser);
        // console.log(newUser.imageURL);
        return newUser;
    }

    async blockUser(userName42: string, id: string): Promise<User>{
        let newUser = await this.userRepository.findOneBy({ userName42 });
        newUser.blocked.push(id);
        // console.log("LOG FROM BLOCK USER");
        // console.log(newUser.blocked);
        newUser = await this.userRepository.save(newUser);
        return newUser;
    }

    async unBlockUser(userName42: string, id: string): Promise<User>{
        let newUser = await this.userRepository.findOneBy({ userName42 });
        let index = newUser.blocked.indexOf(id);
        // newUser.blocked.length = 0;
        if (index != -1) {
            newUser.blocked.splice(index, 1);
        }
        newUser = await this.userRepository.save(newUser);
        return newUser;
    }

    async makeFriend(userName42: string, id: number): Promise<User>{
        const newUser = await this.userRepository.findOneBy({ userName42 });
        newUser.friends.push(id.toString());
        await this.userRepository.save(newUser);
        return newUser;
    }

    async removeFriend(userName42: string, id: number): Promise<User>{
        const newUser = await this.userRepository.findOneBy({ userName42 });
        let index = newUser.friends.indexOf(id.toString());
        // newUser.friends.length = 0;
        if (index != -1) {
            newUser.friends.splice(index, 1);
        }
        await this.userRepository.save(newUser);
        return newUser;
    }

    async refreshActivationCode(userName42: string): Promise<User>{
        let newUser = await this.userRepository.findOneBy({ userName42 });
        newUser.activationLink = uuidv4().slice(0, 6);
        newUser = await this.userRepository.save(newUser);
        return newUser;
    }

    async changeTWOFA(userName42: string): Promise<User>{
        let newUser = await this.userRepository.findOneBy({ userName42 });
        //console.log(`LOG FROM TWOFA : ${userName42} - ${newUser.TWOFA}`)
        newUser.TWOFA = newUser.TWOFA == true ? false : true;
        newUser = await this.userRepository.save(newUser);
        //console.log(`LOG FROM TWOFA : ${userName42} - ${newUser.TWOFA}`)
        return newUser;
    }

    async updateScore(match : IMatch){
        ++match.loser.losses;
        ++match.winner.wins;
        // console.log("LOG FROM UODATE SCORE");
        // console.log(`LOSSES : ${match.loser.losses} and WINS: ${match.winner.wins}`)
        await this.userRepository.save(match.loser);
        await this.userRepository.save(match.winner);
        await this.updateUserLevel(match);
    }

    async updateUserLevel(match: IMatch){
        const newLevel = match.winner.level + 0.42 / (Math.floor(match.winner.level));
        match.winner.level = newLevel;
        // console.log("LOG FROM UODATE USER LEVEL");
        // console.log(`${match.winner.userName42} LEVEL : ${match.winner.level}`)
        await this.userRepository.save(match.winner);
    }

    async changeUserStatus(user: User, state: UserState){
        const tmpUser = await this.getByLogin42(user.userName42);
        tmpUser.state = state;
        await this.userRepository.save(tmpUser);
    }

    async uploadFile(id : number, uploadImageDto: UploadImageDto) {

    }

}
