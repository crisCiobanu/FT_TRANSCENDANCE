import User from "src/users/user.entity";

export interface IChannel{
    id?: number;
    name?: string;
    description?: string;
    channelOwnerId?: number;
    users?: User[];
    created_at?: Date;
    updated_at?: Date;

}