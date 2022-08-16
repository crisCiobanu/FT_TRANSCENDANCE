<script lang="ts">
  import { onMount } from 'svelte';
  import { otherUser, logged, cookie, id } from '../stores.js';

   let user;
   let level: number;
   let losses: number;
   let username: string;
   let wins: number;
   let image_url: string;
   let firstname :string;
   let lastname: string;
   let status;
   let userId;
   let blocked = [];

   let myBlocked = [];
   let myFriends = [];
   let self;

  async function blockUser() {
    let result = await fetch('http://localhost:3000/users/block', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ id: userId }),
    }).then((response) => (result = response.json()));
    // if (result == 'true') {
      alert(username + ' has been blocked 🚫 🚫 🚫');
      myBlocked = [...myBlocked, userId];
    // }
    // else {
    //   alert(username + ' is already among your block list ❎ ❎ ❎')
    // }
  }

  async function unBlockUser() {
    let result = await fetch('http://localhost:3000/users/unblock', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ id: userId }),
    }).then((response) => (result = response.json()));
    // if (result == 'true') {
    //   alert(username + ' has been blocked 🚫 🚫 🚫');
    // }
    // else {
      alert(username + ' has been unblocked ❎ ❎ ❎')
      myBlocked = myBlocked.filter((t) => t != userId);
    // }
  }

  async function friendRequest() {
    let result = await fetch('http://localhost:3000/users/friends', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ id: userId }),
    }).then((response) => (result = response.json()));
    myFriends = [...myFriends, userId];
  }

  async function unFriend() {
    let result = await fetch('http://localhost:3000/users/unfriend', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ id: userId }),
    }).then((response) => (result = response.json()));
    myFriends = myFriends.filter((t) => t != userId);
  }

  onMount(async () => {
    user = await fetch('http://localhost:3000/users/' + $otherUser, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
    }).then((response) => (user = response.json()));
    username = user.userName;
    userId = user.id.toString();
    firstname = user.firstName;
    lastname = user.lastName;
    wins = user.wins;
    losses = user.losses;
    level = user.level;
    image_url = user.imageURL;
    status = user.status;
    blocked = user.blocked;
    self = await fetch('http://localhost:3000/users/' + $id, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
    }).then((response) => (self = response.json()));
    myBlocked = self.blocked;
    myFriends = self.friends;
  });
</script>

<main>
  {#if $logged == 'true'}
    {#if blocked && blocked.indexOf($id.toString()) != -1}
      <h1 style="text-align: center">
        ACCESS TO THIS PROFILE HAS BEEN DENIED BY THE OWNER
      </h1>
    {:else}
      <div style="margin: 0 auto; display: block">
        <h1 class="name" style="color:black">{username}</h1>
        <img
          class="profile"
          src={image_url}
          width="200px"
          alt="Default Profile"
        />
      </div>
      <div>
        <p
          style="text-align:center; color:grey; font-weight:500; font-style: italic"
        >
          {firstname}
          {lastname}<br />
        </p>
        {#if myFriends.indexOf(userId) != -1}
         <p style='text-align: center'>✔️ <i>Friends</i></p>
        {/if}
      </div>
      <div>
        <h1>
          {#if status == 'online'}
            <span class="sp1">Status</span><span class="sp2">🟢 {status}</span>
          {:else if status == 'offline'}
            <span class="sp1">Status</span><span class="sp2">🔴 {status}</span>
          {:else if status == 'ingame'}
            <span class="sp1">Status</span><span class="sp2">🔵 {status}</span>
          {/if}
        </h1>
      </div>
      <div class="buttons">
        {#if myFriends.indexOf(userId) != -1}
        <button on:click={unFriend} style='color: white; background-color: navy;' class="friend">👎 Unfriend</button>
        {:else}
        <button on:click={friendRequest} style='color: white; background-color: dodgerblue;' class="friend">🍻 Add as friend</button>
        {/if}
        {#if myBlocked.indexOf(userId) != -1}
        <button on:click={unBlockUser} class="block2">Unblock user ♻️</button>
        {:else}
        <button on:click={blockUser} class="block">Block user 🚫</button>
        {/if}
      </div>

      <div class="tb1">
        <h1
          style="width: 400px;background-color: darkgrey; color:white;text-decoration-line: underline;text-underline-offset: 20px;"
        >
          SCORES
        </h1>
        <h1>
          <span class="sp1">wins</span>
          <span class="sp2"> {wins}</span><span class="sp1"
            >&emsp;&emsp;&emsp;losses</span
          > <span class="sp2">{losses}</span><span class="sp1"
            >&emsp;&emsp;&emsp;level</span
          ><span class="sp2"> {level}</span>
        </h1>
        <!-- <h1><span class="sp1">ID   </span><span class="sp2">  {$id}</span></h1> -->
      </div>
      <div style="width: 400px;margin: 0 auto; display: block">
        <h1 style="background-color: darkgrey; color:white; text-align:center;">
          MATCH HISTORY
        </h1>
      </div>
      <div style="width:400px; margin: 0 auto; display: block;">
        <h1 style="background-color: darkgrey; color:white; text-align:center;">
          FRIENDS
        </h1>
      </div>
    {/if}
  {:else}
    <h1 style="text-align: center">ACCESS DENIED</h1>
  {/if}
</main>

<style>
  main {
    display: grid;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
      sans-serif;
    align-items: center;
    margin: 0 auto;
  }
  h1 {
    font-weight: 700;
    font-size: 30px;
  }
  .profile {
    width: 200px;
    height: 200px;
    background-size: contain;
    background-position: center;
    border-radius: 50%;
    border: solid 10px gainsboro;
  }
  .name {
    text-align: center;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
      sans-serif;
    font-size: 3rem;
  }

  .tb1 {
    margin: 0 auto;
    margin-top: 30px;
    display: block;
    text-align: center;
    align-items: center;
  }
  .sp1 {
    font-weight: 700;
    font-size: 2rem;
  }
  .sp2 {
    font-weight: 200;
    font-size: 2rem;
  }

  .buttons {
    display: flex;
    flex-direction: row;
    margin: 0 auto;
  }

  .friend {
    flex-direction: column;
    color: white;
    padding: 10px;
    /* margin: 0 auto; */
    display: flex;
  }

  .block {
    flex-direction: column;
    background-color: darkred;
    color: white;
    padding: 10px;
    /* margin: 0 auto; */
    display: flex;
  }

  .block2 {
    flex-direction: column;
    background-color: lightgreen;
    color: darkslategray;
    padding: 10px;
    /* margin: 0 auto; */
    display: flex;
  }
</style>
