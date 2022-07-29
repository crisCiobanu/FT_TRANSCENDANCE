import { writable } from 'svelte/store';

const user = 'a.b@c.com'
const pass = '123456'

export const store = writable(null);

export const getUserDetails = async (username, password) => {
	if (username === user && password === pass)
		return 1;
}