import { Channel } from "src/chat/channel/channel.entity";
import { Connection } from "src/chat/connection/connection.entity";
import { Message } from "src/chat/message/message.entity";
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, JoinTable } from "typeorm";

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

    @OneToMany(() => Connection, connection => connection.user)
    connections: Connection[];

    @ManyToMany(() => Channel, channel => channel.users)
    channels: Channel[];

    @OneToMany(() => Message, message => message.channel, { cascade: true })
	messages: Message[];

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

    @Column({
        default: false
    })
    public ownMail: boolean;

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

    @Column({
        default: false
    })
    public isBanned: boolean;

    @Column({
        default: false
    })
    public isMuted: boolean;

    @Column({
        nullable: true
    })
    public banExpiration: Date;

    @Column({
        nullable: true
    })
    public muteExpiration: Date;

    @Column('simple-array', {
        default: []
    })
    blocked: string[]

    @Column('simple-array', {
        default: []
    })
    friends: string[]


}

export default User;