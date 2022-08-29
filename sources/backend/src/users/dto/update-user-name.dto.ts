import { IsEmail, IsOptional, IsInt, IsNotEmpty, IsPositive, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateUserNameDto{
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(16)
    username : string;
}

export class UpdateUserEmailDto{
    @IsNotEmpty()
    @IsEmail()
    email : string;
}