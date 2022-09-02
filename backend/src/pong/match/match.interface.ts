import User from "src/users/user.entity";
export interface IMatch {
    id?: number;
    created_at?: Date;
    score: string;
    winner?: User;
    loser?: User;
}