export class Puck {
	constructor({ x, y, r, speed = 3 }) {
		this.x = x;
		this.x0 = x;
		this.y = y;
		this.y0 = y;
		this.r = r;
		this.startAngle = 0;
		this.endAngle = Math.PI * 2;
		this.dx = 0;
		this.dy = 0;
		this.initialSpeed = speed;
		this.speed = speed;
	}
}

export class Paddle {
	constructor({ x, y, w, h, keys, speed = 3.5, score = 0 }) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.y0 = y;
		this.dy = 0;
		this.speed = speed;
		this.keys = keys;
		this.score = score;
	}
}
