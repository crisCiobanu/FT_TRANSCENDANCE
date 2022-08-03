import { writable } from 'svelte/store';
import { browser } from '$app/env';

//const on = localStorage.content;

export const id = writable(localStorage.getItem("id") || 0);
id.subscribe((val) => localStorage.setItem("id", val));

export const logged = writable(localStorage.getItem("logged") || "false");
logged.subscribe((val) => localStorage.setItem("logged", val));

export const intra = writable(localStorage.getItem("intra") || "false");
intra.subscribe((val) => localStorage.setItem("intra", val));

export const TWOFA = writable(localStorage.getItem("TWOFA") || "false");
TWOFA.subscribe((val) => localStorage.setItem("TWOFA", val));

export const level = writable(localStorage.getItem("level") || 0);
level.subscribe((val) => localStorage.setItem("level", val));

export const losses = writable(localStorage.getItem("losses") || 0);
losses.subscribe((val) => localStorage.setItem("losses", val));

export const wins = writable(localStorage.getItem("wins") || 0);
wins.subscribe((val) => localStorage.setItem("wins", val));

export const username = writable(localStorage.getItem("username") || "player");
username.subscribe((val) => localStorage.setItem("username", val));

export const image_url = writable(localStorage.getItem("image_url") || "img/default_profile.png");
image_url.subscribe((val) => localStorage.setItem("image_url", val));

export const firstname = writable(localStorage.getItem("firstname") || "");
firstname.subscribe((val) => localStorage.setItem("firstname", val));

export const lastname = writable(localStorage.getItem("lastname") || "");
lastname.subscribe((val) => localStorage.setItem("lastname", val));

export const cookie = writable(localStorage.getItem("cookie") || "");
cookie.subscribe((val) => localStorage.setItem("cookie", val));

// const itemName = "array";
// const retrieved = localStorage.getItem(itemName);
// //const parsed = JSON.parse(retrieved);
// export const array = writable(parsed || []);
// array.subscribe(val => localStorage.setItem(itemName, JSON.stringify(val))); 