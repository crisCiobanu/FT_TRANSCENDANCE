import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { MailService } from 'src/auth/mail.service';
import { DatabaseModule } from 'src/database/database.module';
import { TypeORMError } from 'typeorm';
import User from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [DatabaseModule,
        AuthModule,
        TypeOrmModule.forFeature([User]),
        forwardRef(() => AuthModule)   
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService]
})
export class UsersModule {}
