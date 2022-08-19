import { Socket } from 'socket.io'

export enum State{
	WAITING,
	STARTING,
	INPROGRESS,
	FINISHED
}

export interface IBall{
	x: number;
	x0?: number;
	y: number;
	y0?:number;
	r: number;
	startAngle?: number;
	endAngle?: number;// = Math.PI * 2;
	dx?:number;
	dy?:number;
	initialSpeed?:number;
	speed?:number;
}

export interface IPaddle{
	x: number;
	y: number;
	w: number
	h: number;
	y0?: number;
	dy?: number;
	speed?: number;
	score?: number;
	userId?: number;
	socket?: string;
}

export interface IGame{
	name: string;
	leftPaddle: IPaddle;
	rightPaddle: IPaddle;
	ball: IBall;
	state: State;
	spectators?: string[];
	accepted?: number;
}

