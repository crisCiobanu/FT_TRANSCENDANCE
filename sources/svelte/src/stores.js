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

export const email = writable(localStorage.getItem("email") || "");
email.subscribe((val) => localStorage.setItem("email", val));

export const ownmail = writable(localStorage.getItem("ownmail") || "");
ownmail.subscribe((val) => localStorage.setItem("ownmail", val));

export const currentRoom = writable(localStorage.getItem("currentRoom") || "general");
currentRoom.subscribe((val) => localStorage.setItem("currentRoom", val));

// const itemName = "array";
// const retrieved = localStorage.getItem(itemName);
// //const parsed = JSON.parse(retrieved);
// export const array = writable(parsed || []);
// array.subscribe(val => localStorage.setItem(itemName, JSON.stringify(val))); 

export const other_level = writable(localStorage.getItem("other_level") || 0);
other_level.subscribe((val) => localStorage.setItem("other_level", val));

export const other_losses = writable(localStorage.getItem("other_losses") || 0);
other_losses.subscribe((val) => localStorage.setItem("other_losses", val));

export const other_wins = writable(localStorage.getItem("other_wins") || 0);
other_wins.subscribe((val) => localStorage.setItem("other_wins", val));

export const other_username = writable(localStorage.getItem("other_username") || "player");
other_username.subscribe((val) => localStorage.setItem("other_username", val));

export const other_image_url = writable(localStorage.getItem("other_image_url") || "img/default_profile.png");
other_image_url.subscribe((val) => localStorage.setItem("other_image_url", val));

export const other_firstname = writable(localStorage.getItem("other_firstname") || "");
other_firstname.subscribe((val) => localStorage.setItem("other_firstname", val));

export const other_lastname = writable(localStorage.getItem("other_lastname") || "");
other_lastname.subscribe((val) => localStorage.setItem("other_lastname", val));