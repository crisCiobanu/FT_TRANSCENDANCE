<script lang="ts">
  import { logged, intra, currentChat, currentPage, cookie } from './stores.js';
  import Router from 'svelte-spa-router';
  import Chat from './routes/Chat.svelte';
  import Home from './routes/Home.svelte';
  import NotFound from './routes/NotFound.svelte';
  import Profile from './routes/Profile.svelte';
  import UserProfile from './routes/UserProfile.svelte';
  import Pong from './routes/Pong.svelte';
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import { Socket } from 'socket.io-client';
  import io from 'socket.io-client';

  let socket = null;

  let kuki = $cookie;

  let routes = {
    '/': Home,
    '/pong': Pong,
    '/chat': Chat,
    '/profile': Profile,
    '/userprofile': UserProfile,
    '/*': NotFound,
  };

  async function logOut() {
    if ($intra == 'true') {
      logged.update((n) => 'false');
      intra.update((n) => 'false');
      localStorage.removeItem('currentChat');
      localStorage.removeItem('currentPage');
      localStorage.removeItem('invitedPlayer');
      for(let key in localStorage) {
        delete localStorage[key];
    }
      var cookies = document.cookie.split(';');

      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf('=');
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      await fetch('http://localhost:3000/users/logout', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + kuki,
          'Content-type': 'application/json; charset=UTF-8',
        },
      });
      location.reload();
      alert('✅ You successfully logged out');
    }
  }

  onMount(() => {});
</script>

<main>
  <img src="img/pong.svg" style="width: 300px;" alt="Pong icon" />
  <nav class="menu">
    {#if $logged == 'true'}
      {#if $currentPage == 'home'}
        <a
          on:click={() => {
            currentPage.update((n) => 'home');
          }}
          class="item_active"
          href="#/">HOME</a
        >
      {:else}
        <a
          on:click={() => {
            currentPage.update((n) => 'home');
          }}
          class="item"
          href="#/">HOME</a
        >
      {/if}

      {#if $currentPage == 'profile'}
        <a
          on:click={() => {
            currentPage.update((n) => 'profile');
          }}
          class="item_active"
          href="#/profile">PROFILE</a
        >
      {:else}
        <a
          on:click={() => {
            currentPage.update((n) => 'profile');
          }}
          class="item"
          href="#/profile">PROFILE</a
        >
      {/if}

      {#if $currentPage == 'chat'}
        <a
          on:click={() => {
            currentPage.update((n) => 'chat');
          }}
          class="item_active"
          href="#/chat">CHAT</a
        >
      {:else}
        <a
          on:click={() => {
            currentPage.update((n) => 'chat');
          }}
          class="item"
          href="#/chat">CHAT</a
        >
      {/if}

      {#if $currentPage == 'pong'}
        <a
          on:click={() => {
            currentPage.update((n) => 'pong');
          }}
          class="item_active"
          href="#/pong">PONG</a
        >
      {:else}
        <a
          on:click={() => {
            currentPage.update((n) => 'pong');
          }}
          class="item"
          href="#/pong">PONG</a
        >
      {/if}

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
<Router {routes} />

<style>
  main {
    text-align: center;
    padding: 1em;
    min-width: auto;
    margin: 0 auto;
    align-items: center;
    justify-content: center;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
      sans-serif;
  }

  .menu {
    align-items: center;
    margin: 0 auto;
    margin-top: 20px;
  }
  .item {
    font-size: 12px;
    text-align: center;
    display: inline-block;
    padding-top: 5px;
    padding-bottom: 5px;
    padding-left: 20px;
    padding-right: 20px;
    color: rgb(255, 255, 255);
    background-color: hsl(0, 0%, 44%);
  }
  .item_active {
    font-size: 12px;
    text-align: center;
    display: inline-block;
    padding-top: 5px;
    padding-bottom: 5px;
    padding-left: 20px;
    padding-right: 20px;
    color: rgb(255, 255, 255);
    background-color: darkslategray;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
      align-items: center;
      margin: 0 auto;
    }
  }
</style>
