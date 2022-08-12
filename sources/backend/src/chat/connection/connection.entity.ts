import User from "src/users/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Connection{

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public socket: string;

    @ManyToOne(() => User, user => user.connections)
    public user: User;

}