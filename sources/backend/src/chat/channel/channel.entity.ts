
import User from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Message } from "../message/message.entity";
import { PunishedUser } from "../punisheduser/punisheduser.entity";

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

    @ManyToMany(() => User, { onDelete: 'CASCADE'})
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

    @OneToMany(() => PunishedUser, punish => punish.channel, { cascade: true })
	bansAndMutes: PunishedUser[];

    @CreateDateColumn( { type: 'timestamptz' })
    public created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
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