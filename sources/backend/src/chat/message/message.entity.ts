import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Message{
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public text: string;

    @CreateDateColumn()
    public created_at: Date;

}