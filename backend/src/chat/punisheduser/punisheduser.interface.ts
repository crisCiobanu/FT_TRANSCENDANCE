import { Channel } from "../channel/channel.entity";

export interface IPunishedUser{
	id?: number;
	expires?: Date;
	banned?: boolean;
	muted?: boolean;
	userId?: number;
	channel?: Channel; 
}