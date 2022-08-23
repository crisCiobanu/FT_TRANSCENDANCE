<script lang="ts">
  import { onMount } from 'svelte';
  import { otherUser, logged, cookie, id, invitedPlayer,invitation } from '../stores.js';

   let user;
   let level: number;
   let losses: number;
   let username: string;
   let username42: string;
   let wins: number;
   let image_url: string;
   let firstname :string;
   let lastname: string;
   let status;
   let userId: number;
   let blocked = [];

   let myBlocked = [];
   let myFriends = [];
   let self: any;
   let matches = [];
   let myMatches;
  
   import io, { Manager } from 'socket.io-client';
import App from '../App.svelte';

   export let socket = null;

   async function sendInvitation() {
   invitedPlayer.update(n => username42);
   invitation.update(n => 'true');
   window.location.replace("http://localhost:8080/#/pong");
  }

  async function blockUser() {
    let result = await fetch('http://localhost:3000/users/block', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ id: userId }),
    }).then((response) => (result = response.json()));
      alert(username + ' has been blocked 🚫 🚫 🚫');
      myBlocked = [...myBlocked, userId];
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
      alert(username + ' has been unblocked ❎ ❎ ❎')
      myBlocked = myBlocked.filter((t) => t != userId);
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
    socket = io('http://localhost:3000/online', {
      auth: { token: $cookie },
    });
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
    level = user.level.toFixed(1);
    image_url = user.imageURL;
    status = user.state;
    blocked = user.blocked;
    username42 = user.userName42;
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
    myMatches = await fetch('http://localhost:3000/matches/getForUser', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ id: userId }),
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
    }).then((response) => (myMatches = response.json()));
    console.log(myMatches);
    matches = myMatches;
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
         <p style='text-align: center; margin-bottom: -10px; color: royalblue'>✔︎ <i>Friends</i></p>
        {/if}
      </div>
      {#if myFriends.indexOf(userId) != -1}
      <div>
        <h1 style='text-align:center;'>
          {#if status == 1}
           <span class="sp2">🟢 online</span>
          {:else if status == 0}
           <span class="sp2">🔴 offline</span>
          {:else if status == 3}
           <span class="sp2">🔵 gaming</span>
          {:else if status == 2}
           <span class="sp2">🟠 chatting</span>
          {/if}
        </h1>
      </div>
      {/if}
      <div class="buttons">
        {#if myFriends.indexOf(userId) != -1}
        <button on:click={unFriend} style='width: 200px; color: white; background-color: slategrey;' class="friend">Unfriend</button>
        {:else}
        <button on:click={friendRequest} style='width: 200px;color: white; background-color: dodgerblue;' class="friend">Add as friend</button>
        {/if}
        {#if myBlocked.indexOf(userId) != -1}
        <button on:click={unBlockUser} class="block2">Unblock user</button>
        {:else}
        <button on:click={blockUser} class="block">Block user</button>
        {/if}
      </div>
      <button on:click={sendInvitation}>Invite to play</button>
          <!-- {#if myFriends.indexOf(userId) != -1} -->
          <div class="tb1">
            <h1
              style="text-align: center;width: 400px;background-color: darkgrey; color:white;text-decoration-line: underline;text-underline-offset: 20px;"
            >
              SCORES
            </h1>
            <h1 style='text-transform: uppercase;'>
              <p><span class="sp1">wins</span> <span class="sp2">{wins}</span
                > <span style='font-weight:300;'> | </span><span class="sp1">losses</span> <span class="sp2">{losses}</span
                > <span style='font-weight:300;'> | </span><span class="sp1">level</span> <span class="sp2">{level}</span
                ></p>
            </h1>
          </div>
          <!-- {/if} -->
      <div style="width: 400px;margin: 0 auto; display: block">
        <h1 style="background-color: darkgrey; color:white; text-align:center;">
          MATCH HISTORY
        </h1>
        <!-- <div style='display:block; margin: 0 auto; text-align: center'> -->
          <div class='row' id ='history' style='max-height: 150px; overflow-y: scroll; margin: 0 auto; display:block;  align-content: center; text-align: center'>
          {#each [...matches].reverse() as match}
          {#if match.winner.userName42 == username42}
          <div class='column' style='float: left; width: 30%; display: block; margin:0 auto;'>
          <p style='color: green; font-weight: 700'>Won to</p>
          </div>
          <div class='column' style='float: left; width: 30%;'>
            <p>{match.loser.userName42}</p>
            </div>
            <div class='column' style='float: left; width: 30%;'>
              <p>{match.score}</p>
              </div>
          {:else}
          <div class='column' style='float: left; width: 30%;'>
            <p style='color: red; font-weight: 700'>Lost to</p>
            </div>
            <div class='column' style='float: left; width: 30%;'>
              <p>{match.winner.userName42}</p>
              </div>
              <div class='column' style='float: left; width: 30%;'>
                <p>{match.score}</p>
                </div>
                {/if}
          {/each}
        </div>
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
    color: black;
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
    display: block;
    margin: 0 auto;
    color:royalblue;
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
    font-size: 20px;;
  }
  .sp2 {
    font-weight: 200;
    font-size: 20px;;
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
    display: flex;
  }

  .block {
    flex-direction: column;
    background-color: rgb(224, 62, 62);
    color: white;
    padding: 10px;
    display: flex;
    width: 200px;
  }

  .block2 {
    flex-direction: column;
    background-color: lightgreen;
    color: darkslategray;
    padding: 10px;
    display: flex;
    width: 200px;
  }
</style>
