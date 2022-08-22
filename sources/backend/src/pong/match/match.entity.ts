import User from "src/users/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
@Entity()
export class Match{
    @PrimaryGeneratedColumn()
    id: number;
    @CreateDateColumn({ type: 'timestamptz' })
    public created_at: Date;
    @Column()
    score: string;
    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    winner: User;
    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    loser: User;
}