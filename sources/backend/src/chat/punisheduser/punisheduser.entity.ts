import { Column, Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Channel } from "../channel/channel.entity";

@Entity()
export class PunishedUser{
	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: 'timestamptz' })
	public expires: Date;

	@Column({
		default: false
	})
	banned: boolean;

	@Column({
		default: false
	})
	muted: boolean;

	@Column()
	userId: number;

	@ManyToOne(() => Channel, channel => channel.bansAndMutes, {onDelete:'CASCADE'})
	@JoinTable()
	channel: Channel;
		
}
