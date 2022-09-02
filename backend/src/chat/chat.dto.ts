import { IsEmail, IsDecimal, IsNumberString, IsOptional, IsInt, IsNotEmpty, IsPositive, IsString, MaxLength, MinLength } from "class-validator";

export class KickDto{
	@IsNotEmpty()
	channel: string;
	@IsNotEmpty()
	userName42: string;
}

export class BanDto{
	@IsNotEmpty()
	channel: string;
	@IsNotEmpty()
	userName42: string;
	@IsNumberString()
	@IsNotEmpty()
	minutes: number
}

export class ChangePassDto{
	@IsNotEmpty()
	room: string;
	@IsNotEmpty()
	@MinLength(4)
	@MaxLength(16)
	pass: string;
}