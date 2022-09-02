import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import User from "src/users/user.entity";

@Injectable()
export class TokenServcie{

    constructor (private jwtService : JwtService){};

    async generateToken(user: User){
        const payload = {email: user.email, id: user.id};
        return {
            token: this.jwtService.sign(payload)
        }
    }

}