<script lang="ts">

import { level, logged, losses, username, wins, image_url, firstname, lastname, intra, cookie } from './stores.js';
import Router from "svelte-spa-router";
import Chat from "./routes/Chat.svelte";
import Home from "./routes/Home.svelte";
import NotFound from "./routes/NotFound.svelte";
import Pong from "./routes/Pong.svelte";
import Profile from "./routes/Profile.svelte";
import User from "./routes/User.svelte";

let routes = {
	// "/": Home,
	"/": Home,
	"/pong": Pong,
	"/chat": Chat,
	"/profile": Profile,
	"/user": User,
	"/*": NotFound,

	}
	function logOut () {
		if ($intra == 'true')
		{
			logged.update(n => 'false');
			intra.update(n => 'false');
			cookie.update(n => "");
			alert('✅ You successfully logged out');
		}
	};

</script>

<main>
	<img src="img/pong.svg" style="width: 300px;" alt="Pong icon">
	<nav class="menu">
		{#if $logged == 'true'}
		<a class="item" href="#/">HOME</a>
		<a class="item" href="#/pong">PONG</a>
		<a class="item" href="#/profile">PROFILE</a>
		<a class="item" href="#/chat">CHAT</a>
		<a class="item" on:click={logOut} href="#/">LOGOUT</a>
		{:else}
		<a class="item" href="#/">HOME</a>
		<a class="item" href="#/">PONG</a>
		<a class="item" href="#/">PROFILE</a>
		<a class="item" href="#/">CHAT</a>
		<a class="item" on:click={logOut} href="#/">LOGOUT</a>
		{/if}
	</nav>
</main>
<Router {routes}/>

<style>
	main {
		text-align: center;
		padding: 1em;
		min-width: auto;
		margin: 0 auto;
		align-items: center;
		justify-content: center;
	}

	 .menu {
		font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
		align-items: center;
		margin: 0 auto;
		margin-top: 20px;
	}
	.item {
		font-size: 12px;
		text-align: center;
		font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
		display: inline-block;
		padding-top: 5px;
		padding-bottom: 5px;
		padding-left: 20px;
		padding-right: 20px;
		color: rgb(255, 255, 255);
		 background-color: hsl(0, 0%, 44%);
		}

	@media (min-width: 640px) {
		main {
			max-width: none;
			align-items: center;
			margin: 0 auto;
		}
	}
</style>