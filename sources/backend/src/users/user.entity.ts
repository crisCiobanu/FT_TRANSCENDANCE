import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    public id: number;

    @Column({
        nullable: false
    })
    public email: string;

    @Column({
        nullable: false
    })
    public userName: string;

    @Column({
        nullable: false
    })
    public firstName: string;

    @Column({
        nullable: false
    })
    public lastName: string;

    @Column({
        default: 0
    })
    public wins: number;

    @Column({
        default: 0
    })
    public losses: number;

    @Column({
        default: 1
    })
    public level: number;

    @Column({
        // nullable: false,
        // default: "../../../svelte/public/img/default_profile.png"
    })
    public imageURL: string;

    @Column()
    public password: string;

    @Column()
    public age: number;
}

export default User;