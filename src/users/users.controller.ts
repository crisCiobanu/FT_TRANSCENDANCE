import { Body, Controller, Delete, Get, Header, HttpCode, HttpStatus, Param, Post, Redirect, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from 'src/auth/jwt.guard';
import { CreateUserDto } from './dto/create-user.dto';
import User from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

    constructor (private userService : UsersService) {
    }

    @Post(':id')
    create(@Body() createUserDto : CreateUserDto, @Param('id') par : number) : Promise<User>{
        return this.userService.create(createUserDto);
    }
    
    @UseGuards(JwtGuard)
    @Get()
    findAll() : Promise<User[]>{
        return this.userService.getAll();
    }

    @Get(':id')
    findById(@Param('id') parameter : number) : Promise<User>{
        console.log(parameter);
        return this.userService.getById(parameter);
    }

    @Delete(':id')
    deleteById(@Param('id') parameter: number) : Promise<void>{
        console.log('Trying to delete : ' + parameter);
        return this.userService.delete(parameter);
    }
}
