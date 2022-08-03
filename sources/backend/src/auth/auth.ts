import { CreateUserDto } from "src/users/dto/create-user.dto";
import User from "src/users/user.entity";

export interface AuthenticationProvider {
    validateUser(details: CreateUserDto);
    createUser(details: CreateUserDto);
    findUser(email: string): Promise<User | undefined>;
  }