import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public email: string;

    @Column()
    public name: string;

    @Column()
    public forname: string;

    @Column()
    public password: string;

    @Column()
    public age: number;
}

export default User;