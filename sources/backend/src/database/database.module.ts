import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Token from 'src/auth/token.entity';
import { Product } from 'src/products/product.entity';
import User from 'src/users/user.entity';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('POSTGRES_HOST'),
                port: configService.get('POSTGRES_PORT'),
                username: configService.get('POSTGRES_USER'),
                password: configService.get('POSTGRES_PASSWORD'),
                database: configService.get('POSTGRES_DB'),
                entities: [User, Product, Token],
                synchronize: true,
            })
        })
    ],
})
export class DatabaseModule {}
