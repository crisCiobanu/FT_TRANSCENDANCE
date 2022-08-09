import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt/jwt.guard';
import { UsersService } from 'src/users/users.service';
import { IChannel } from './channel/channel.interface';
import { ChannelService } from './channel/channel.service';

@Controller('chat')
export class ChatController {
    constructor( private readonly channelService: ChannelService,
                private readonly userServcie: UsersService){
    }

    @Post('createRoom')
    @UseGuards(JwtGuard)
    async createRoom(@Res({passthrough: true}) res: Response, @Req() req: any){
        const user = await this.userServcie.getByLogin42(req.user.userName42);
        return this.channelService.createChannel({name: req.body.name, password: req.body.password, isPublic: req.body.public}, user);
    }

    @Get('deletechannels')
    async deleteAllChanels(){
        await this.channelService.deleteAllChannels();
    }
}
