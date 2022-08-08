import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { MyMailService } from 'src/auth/mail.service';
import { Channel } from 'src/chat/channel/channel.entity';
import { ChatModule } from 'src/chat/chat.module';
import { DatabaseModule } from 'src/database/database.module';
import { TypeORMError } from 'typeorm';
import User from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [DatabaseModule,
        AuthModule,
        ChatModule,
        TypeOrmModule.forFeature([User]),
        forwardRef(() => AuthModule)   
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService]
})
export class UsersModule {}
