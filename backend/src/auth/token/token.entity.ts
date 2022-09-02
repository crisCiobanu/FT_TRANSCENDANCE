import { Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Token {

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public accessToken: string;

    @Column()
    public refreshToken: string;

}

export default Token;