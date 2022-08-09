import User from "src/users/user.entity";
import { IChannel } from '../channel/channel.interface';

export interface IMessage {
	id?: number;
	text: string;
	user?: User;
	channel?: IChannel;
	created_at?: Date;
}