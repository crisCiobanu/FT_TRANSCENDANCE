import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Paddle, Puck } from './pong.utils';
import { User } from '../users/user.entity';
import { Socket } from 'socket.io';
import { IGame, IPaddle, IBall, State } from './pong.interfaces'; 

export const map = (value, minDomain, maxDomain, minRange, maxRange) =>
minRange +
			((value - minDomain) / (maxDomain - minDomain)) * (maxRange - minRange);

const canvasWidth = 500;
const canvasHeight = 320;
const padding = 10;
const margin = 5;
const border = 5;

const width = canvasWidth - margin * 2;
const height = canvasHeight - margin * 2;

const puckRadius = 7;

const paddleWidth = 15;
const paddleHeight = 70;



@Injectable()
export class PongService {

	ball: IBall = { x: width / 2, y: height / 2, r: puckRadius, startAngle: 0, endAngle: Math.PI * 2, dx: 0, dy: 0, initialSpeed: 3, speed: 3 };

	defaultPaddleLeft: IPaddle ={
		x: padding,
		y: height / 2 - paddleHeight / 2,
		w: paddleWidth,
		h: paddleHeight,
		};
	defaultPaddleRight: IPaddle = {
		x: width - padding - paddleWidth,
		y: height / 2 - paddleHeight / 2,
		w: paddleWidth,
		h: paddleHeight,
	};

	// private async initPaddles(firstSocket: Socket, secondSocket: Socket): Promise<any>{
	// 	let leftPaddle = this.defaultPaddleLeft;
	// 	leftPaddle.userId = firstSocket.data.user.id;
	// 	leftPaddle.socket = firstSocket.id;
	// }

	async createGame(firstSocket: Socket, secondSocket: Socket): Promise<IGame>{
		if (!firstSocket.data.user || !secondSocket.data.user)
			return null;

		
		const gameName = firstSocket.data.user.userName42 + ' - ' + secondSocket.data.user.userName42;
		let leftPad = this.defaultPaddleLeft;
		leftPad.userId = firstSocket.data.user.id;
		leftPad.socket = firstSocket.id;
		let rightPad = this.defaultPaddleRight;
		rightPad.userId = secondSocket.data.user.id;
		rightPad.socket = secondSocket.id;

		const createdGame: IGame = { name: gameName,
							leftPaddle: leftPad,
							rightPaddle: rightPad,
							ball: this.ball,
							state: State.WAITING,
							accepted: 0};
		
		return createdGame;
	
	}

	async startBall(game: IGame): Promise<IGame> {
		const maxAngle = 90;
		const angles = 5;
		const angle = Math.floor(Math.random() * (angles + 1));

		const theta = ((angle * (maxAngle / angles) - 45) / 180) * Math.PI;

		const dx = Math.cos(theta) * game.ball.speed;
		const dy = Math.sin(theta) * game.ball.speed;

		game.ball.dx = Math.random() > 0.5 ? dx : dx * -1;
		game.ball.dy = dy;
		return game;
	}

	isCollision(ball: IBall, paddle: IPaddle): boolean {
		const { x, y, r } = ball;
		if (
			x + r < paddle.x ||
			x - r > paddle.x + paddle.w ||
			y + r < paddle.y ||
			y - r > paddle.y + paddle.h
		) {
			return false;
		}
		return true;
	}

	async update(game: IGame){
		// game.ball.update();
		// game.leftPaddle.update();
		// game.rightPaddle.update();
		game.ball.x += game.ball.dx;
		game.ball.y += game.ball.dy;
	
		// game.ball bounces against wall
		if (game.ball.y - game.ball.r < 0) {
		  game.ball.y = game.ball.r;
		  game.ball.dy *= -1;
		} else if (game.ball.y + game.ball.r > height) {
		  game.ball.y = height - game.ball.r;
		  game.ball.dy *= -1;
		}
	
		// game.ball bounces against game.paddles
		if (this.isCollision(game.ball, game.leftPaddle)){
		// if (game.ball.collides(game.leftPaddle)) {
		  game.ball.speed *= 1.025;
	
		  const y = (game.ball.y - game.leftPaddle.y) / game.leftPaddle.h;
		  if (y < 0) {
			game.ball.dy = -1;
			game.ball.y = game.leftPaddle.y - game.ball.r;
		  } else if (y > 1) {
			game.ball.dy = 1;
			game.ball.y = game.leftPaddle.y + game.leftPaddle.h + game.ball.r;
		  } else {
			game.ball.x = game.leftPaddle.x + game.leftPaddle.w + game.ball.r;
	
			const maxAngle = 90;
			const angles = 4;
			const angle = Math.round(map(y, 0, 1, 0, angles));
			const theta = ((angle * (maxAngle / angles) - 45) / 180) * Math.PI;
	
			const dx = Math.cos(theta) * game.ball.speed;
			const dy = Math.sin(theta) * game.ball.speed;
	
			game.ball.dx = dx;
			game.ball.dy = dy;
		  }
		} else if (this.isCollision(game.ball, game.rightPaddle)) {
		  game.ball.speed *= 1.025;
	
		  const y = (game.ball.y - game.rightPaddle.y) / game.rightPaddle.h;
		  if (y < 0) {
			game.ball.dy = -1;
			game.ball.y = game.rightPaddle.y - game.ball.r;
		  } else if (y > 1) {
			game.ball.dy = 1;
			game.ball.y = game.rightPaddle.y + game.rightPaddle.h + game.ball.r;
		  } else {
			game.ball.x = game.rightPaddle.x - game.ball.r;
	
			const maxAngle = 90;
			const angles = 4;
			const angle = Math.round(map(y, 0, 1, 0, angles));
			const theta = ((angle * (maxAngle / angles) - 45) / 180) * Math.PI;
	
			const dx = Math.cos(theta) * game.ball.speed;
			const dy = Math.sin(theta) * game.ball.speed;
	
			game.ball.dx = dx * -1;
			game.ball.dy = dy;
		  }
		}
	
		// ball exceeds horizontal constraints
		if (game.ball.x < -game.ball.r || game.ball.x > width + game.ball.r) {
		  if (game.ball.x < width / 2) {
			game.rightPaddle.score += 1;
		  } else {
			game.leftPaddle.score += 1;
		  }
	
		  this.gameReset(game);
		}
	
		// game.paddles exceed vertical constraints
		if (game.leftPaddle.y < 0) {
		  game.leftPaddle.y = 0;
		  game.leftPaddle.dy = 0;
		} else if (game.leftPaddle.y > height - game.leftPaddle.h) {
		  game.leftPaddle.y = height - game.leftPaddle.h;
		  game.leftPaddle.dy = 0;
		}
	
		if (game.rightPaddle.y < 0) {
		  game.rightPaddle.y = 0;
		  game.rightPaddle.dy = 0;
		} else if (game.rightPaddle.y > height - game.rightPaddle.h) {
		  game.rightPaddle.y = height - game.rightPaddle.h;
		  game.rightPaddle.dy = 0;
		}
		return game;
		
	  };

	  async gameReset(game: IGame){
	
		// const paddleLeftGap = this.paddleLeft.y - this.paddleLeft.y0;
		// const paddleRightGap = this.paddleRight.y - this.paddleRight.y0;

	
		// this.ball.reset();
		// // draw();
		// // tween.set(0, { duration: 0 });
		// // playing = false;
		// // handleStart();
	  };


}
