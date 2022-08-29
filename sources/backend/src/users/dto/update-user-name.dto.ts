import { IsEmail, IsInt, IsNotEmpty, IsPositive, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateUserNameDto{
    @IsInt()
    @IsPositive()
    id: number;
    
    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    @MaxLength(16)
    username : string;
}

export class UpdateUserEmailDto{
    @IsInt()
    @IsPositive()
    id: number;

    @IsNotEmpty()
    @IsEmail()
    email : string;
}