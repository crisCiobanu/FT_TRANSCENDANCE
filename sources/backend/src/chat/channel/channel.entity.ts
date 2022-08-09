
import User from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Message } from "../message/message.entity";

@Entity()
export class Channel{
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column({
        nullable: true
    })
    public description: string;

    @ManyToMany(() => User)
    @JoinTable()
    users: User[];

    @OneToMany(() => Message, message => message.channel, { cascade: true })
	messages: Message[];

    @Column({
        nullable: false
    })
    channelOwnerId: number;

    @Column('simple-array', {
        default: []
    })
    channelAdminsId: number[]

    @Column('simple-array', {
        default: []
    })
    bannedUsers: number[];

    @Column('simple-array', {
        default: []
    })
    mutedUsers: number[];

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;

    @Column({
        nullable: true
    }
    )
    public password: string;

    @Column({
        default: true
    })
    public isPublic: boolean;

    @Column({
        default: false
    })
    public isDirectMessage: boolean;





}