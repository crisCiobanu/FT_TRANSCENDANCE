import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Redirect, Req } from '@nestjs/common';
import { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

    constructor (private userService : UsersService) {
    }

    @Post(':id')
    create(@Body() createUserDto : CreateUserDto, @Param('id') par : number): string {
        this.userService.create(createUserDto);
        return createUserDto.name + ' ' + createUserDto.forname + ' ' + par;
    }
    
    @Get()
    findAll(){
        return this.userService.getAll();
    }

    @Get(':aaa')
    findById(@Param('aaa') parameter : number){
        console.log(parameter);
        return this.userService.getById(parameter);
    }

}
