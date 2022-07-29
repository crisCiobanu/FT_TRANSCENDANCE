import { Injectable } from '@nestjs/common';

export type player = {
  wins: number;
  losses: number;
  level: number;
  name: string;
  id :number;
}

export type login = {
  name: string;
}

export let isAuth: any;

@Injectable()
export class AppService {

  getHello(): string {
    return 'Hello World!';
  }

  getAuth(): any {
    return {
      isAuth: false
    }
  }
  getPlayer(): player {
    return {
      id: 2,
      wins: 1,
      losses: 2,
      level: 1.5,
      name: ("damir").toUpperCase()
    };
  }

  getLogin(): login {
    return {
      name: ("rimad").toUpperCase()
    }
  }
}
