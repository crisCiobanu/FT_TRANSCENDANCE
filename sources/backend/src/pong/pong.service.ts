import { Injectable } from '@nestjs/common';
import { Paddle, Puck } from './pong.utils';
import { User } from '../users/user.entity';

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

	puck: Puck = new Puck({ x: width / 2, y: height / 2, r: puckRadius });

	paddleLeft: Paddle = new Paddle({
	x: padding,
	y: height / 2 - paddleHeight / 2,
	w: paddleWidth,
	h: paddleHeight,
	keys: {
		KeyW: -1,
		KeyS: 1,
	},
	});

	paddleRight: Paddle = new Paddle({
	x: width - padding - paddleWidth,
	y: height / 2 - paddleHeight / 2,
	w: paddleWidth,
	h: paddleHeight,
	keys: {
		ArrowUp: -1,
		ArrowDown: 1,
	},
	});

	name: string;


	async update(){
		this.puck.update();
		this.paddleLeft.update();
		this.paddleRight.update();
	
		// this.puck bounces against wall
		if (this.puck.y - this.puck.r < 0) {
		  this.puck.y = this.puck.r;
		  this.puck.dy *= -1;
		} else if (this.puck.y + this.puck.r > height) {
		  this.puck.y = height - this.puck.r;
		  this.puck.dy *= -1;
		}
	
		// this.puck bounces against this.paddles
		if (this.puck.collides(this.paddleLeft)) {
		  this.puck.speed *= 1.025;
	
		  const y = (this.puck.y - this.paddleLeft.y) / this.paddleLeft.h;
		  if (y < 0) {
			this.puck.dy = -1;
			this.puck.y = this.paddleLeft.y - this.puck.r;
		  } else if (y > 1) {
			this.puck.dy = 1;
			this.puck.y = this.paddleLeft.y + this.paddleLeft.h + this.puck.r;
		  } else {
			this.puck.x = this.paddleLeft.x + this.paddleLeft.w + this.puck.r;
	
			const maxAngle = 90;
			const angles = 4;
			const angle = Math.round(map(y, 0, 1, 0, angles));
			const theta = ((angle * (maxAngle / angles) - 45) / 180) * Math.PI;
	
			const dx = Math.cos(theta) * this.puck.speed;
			const dy = Math.sin(theta) * this.puck.speed;
	
			this.puck.dx = dx;
			this.puck.dy = dy;
		  }
		} else if (this.puck.collides(this.paddleRight)) {
		  this.puck.speed *= 1.025;
	
		  const y = (this.puck.y - this.paddleRight.y) / this.paddleRight.h;
		  if (y < 0) {
			this.puck.dy = -1;
			this.puck.y = this.paddleRight.y - this.puck.r;
		  } else if (y > 1) {
			this.puck.dy = 1;
			this.puck.y = this.paddleRight.y + this.paddleRight.h + this.puck.r;
		  } else {
			this.puck.x = this.paddleRight.x - this.puck.r;
	
			const maxAngle = 90;
			const angles = 4;
			const angle = Math.round(map(y, 0, 1, 0, angles));
			const theta = ((angle * (maxAngle / angles) - 45) / 180) * Math.PI;
	
			const dx = Math.cos(theta) * this.puck.speed;
			const dy = Math.sin(theta) * this.puck.speed;
	
			this.puck.dx = dx * -1;
			this.puck.dy = dy;
		  }
		}
	
		// puck exceeds horizontal constraints
		if (this.puck.x < -this.puck.r || this.puck.x > width + this.puck.r) {
		  if (this.puck.x < width / 2) {
			this.paddleRight.score += 1;
		  } else {
			this.paddleLeft.score += 1;
		  }
	
		  this.reset();
		}
	
		// this.paddles exceed vertical constraints
		if (this.paddleLeft.y < 0) {
		  this.paddleLeft.y = 0;
		  this.paddleLeft.dy = 0;
		} else if (this.paddleLeft.y > height - this.paddleLeft.h) {
		  this.paddleLeft.y = height - this.paddleLeft.h;
		  this.paddleLeft.dy = 0;
		}
	
		if (this.paddleRight.y < 0) {
		  this.paddleRight.y = 0;
		  this.paddleRight.dy = 0;
		} else if (this.paddleRight.y > height - this.paddleRight.h) {
		  this.paddleRight.y = height - this.paddleRight.h;
		  this.paddleRight.dy = 0;
		}
	  };

	  async reset(){
	
		const paddleLeftGap = this.paddleLeft.y - this.paddleLeft.y0;
		const paddleRightGap = this.paddleRight.y - this.paddleRight.y0;

	
		this.puck.reset();
		// draw();
		// tween.set(0, { duration: 0 });
		// playing = false;
		// handleStart();
	  };


}
