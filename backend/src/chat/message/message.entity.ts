import User from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Channel } from "../channel/channel.entity";

@Entity()
export class Message{
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public text: string;

    @CreateDateColumn({ type: 'timestamptz' })
    public created_at: Date;

    @ManyToOne(() => User, user => user.messages, { onDelete: 'CASCADE' })
	@JoinColumn()
	user: User;

	@ManyToOne(() => Channel, channel => channel.messages, {onDelete:'CASCADE'})
	@JoinTable()
	channel: Channel;

}