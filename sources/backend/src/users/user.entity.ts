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
    public userName42: string;

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

    @Column({
        default: false
    })
    public isActivated: boolean;

    @Column()
    public activationLink: string;

    @Column()
    public password: string;

    @Column({
        default: true
    })
    public logged: boolean;

    @Column({
        default: false
    })
    public TWOFA: boolean;
}

export default User;