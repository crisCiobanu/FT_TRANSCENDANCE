import User from "src/users/user.entity";

export interface IConnection{
    id?: number;
    socket?: string;
    user?: User;
}