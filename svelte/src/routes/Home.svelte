<script lang='ts'>
import { onMount } from 'svelte';
import { username42, currentPage, level, logged, losses, username, wins, image_url, firstname, lastname, id, intra, TWOFA, cookie, email, ownmail } from '../stores.js';
import io, { Manager } from 'socket.io-client';

export let socket = null;

let blocked = [];
let isAuth;
let code;
let friends;
let error = false;

import { FRONTEND_URL, BACKEND_URL} from '../domain.js'

async function sendCode() {
    await fetch(`${BACKEND_URL}/auth/activation/` + code, {
      method: 'GET',
      headers: 
        {
         'Authorization': 'Bearer ' + $cookie,
         "Content-type": "application/json; charset=UTF-8"
        },
    }).then(response => {
      if (response.status === 200) {
        logged.update(n => 'true');
      }
      else {
        code = '';
        error = true;
      }
    } )
}

function updateAll (isAuth: any) {
      id.update(n => isAuth.id);
      username.update(n => isAuth.userName);
      username42.update(n => isAuth.userName42)
      firstname.update(n => isAuth.firstName);
      lastname.update(n => isAuth.lastName);
      wins.update(n => isAuth.wins);
      losses.update(n => isAuth.losses);
      level.update(n => isAuth.level);
      image_url.update(n => isAuth.imageURL);
      TWOFA.update(n => isAuth.TWOFA.toString());
      email.update(n => isAuth.email);
      ownmail.update(n => isAuth.ownMail.toString());
      blocked = isAuth.blocked;
      friends = isAuth.friends;
}

onMount(async () => {
  currentPage.update(n=> 'home')
  let cookies = document.cookie?.split(';').find(n => n.startsWith('access_token'));
  if (!cookies) {
    return;
  }
  if ($intra == 'false')
  {
            cookie.update(n =>cookies.split('=')[1]);
          isAuth = await fetch(`${BACKEND_URL}/auth/currentuser`, 
          {
              method: 'GET',
              credentials: 'include',
              headers: 
              {
              'Authorization': 'Bearer ' + $cookie,
              "Content-type": "application/json; charset=UTF-8"
              },
          }).then(response => isAuth = response.json());
          updateAll(isAuth);
          intra.update(n => 'true');
            if ($TWOFA == 'false')
            {
              logged.update(n => 'true');
              socket = io(`${BACKEND_URL}/home`, {
              auth: { token: $cookie },
    });
            }
    }
    if ($logged == 'true') {
      socket = io(`${BACKEND_URL}/home`, {
      auth: { token: $cookie },
    });
    }
  }
  )

</script>
<main>
  {#if $logged == 'true'}
  <h1 style="text-align: center; font-weight: 700; margin-top: 50px;">Just a bit of history...</h1>
    <div class="about">
      <p style='text-align:center'>Pong is a table tennis???themed twitch arcade sports video game,
        featuring simple two-dimensional graphics, manufactured by Atari 
        and originally released in 1972. It was one of the earliest arcade 
        video games; it was created by Allan Alcorn as a training exercise 
        assigned to him by Atari co-founder Nolan Bushnell, but Bushnell 
        and Atari co-founder Ted Dabney were surprised by the quality of 
        Alcorn's work and decided to manufacture the game. Bushnell based 
        the game's concept on an electronic ping-pong game included in the 
        Magnavox Odyssey, the first home video game console. In response, 
        Magnavox later sued Atari for patent infringement.</p>
        <img src="img/console.png" style="margin: 0px auto; display: block; width: 250px; padding-top: 20px;" alt="First Pong Game console"/>
    </div>
    {:else if $intra == 'true'}
    <div style="margin: 0 auto;display: block;">
    <h2 style="text-align: center">Check your mails for the authentication code !</h2>
    <input style="width: 150px; display: block; margin: 0 auto; margin-bottom: 20px;text-align: center;" type="password" placeholder="2FA code" bind:value={code} />
    {#if error == true}
    <p style="color: red; text-align:center">Wrong code number</p>
    {/if}
    <button on:click={sendCode} type="submit" value="Submit" style="display: block;margin: 0 auto;">Send</button>
    </div>
    {:else}
    <a href={`${BACKEND_URL}/auth/42`} class="api" style="color: rgb(255, 255, 255);
      text-align: center;
      width: 15vw;
      max-width: 90px;
      min:width:50px;
      padding: 2vw;
      padding-left:8vw;
      padding-right: 8vw;
      margin: 0 auto;
      align-items: center;
      align-content: center;
      font-size: clamp(13px, 2vw, 16px);
      display: block;
      margin-top: 30px;
      background-color: rgb(25, 184, 173);
      line-height: 2;
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;">
      Connect with<br><img src="img/42_logo.png" style='width: 5vw' alt="42 logo"/>
      </a>
    {/if}
</main>
  
  <style>
    main {
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
          align-items: center;
          align-content: center;
          text-align: center;
          display: block;
          margin: 0 auto;
          margin-top: 30px;
          color: black;
          min-width: 360px;
          font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    }

    .about {
      color: balck;
      width: 60vw;
      margin-top: 5vw;
      margin: 0 auto;
      font-size: calc(0.8em + 1vmin);
      font-style: italic;
      font-weight: 300;
      line-height: 1.7;
      text-align: center;
    }
    .api {
      color: rgb(255, 255, 255);
      text-align: center;
      padding: 5px;
      padding-left:40px;
      padding-right: 40px;
      margin: 0 auto;
      align-items: center;
      align-content: center;
      display: block;
      margin-top: 10vw;
      background-color: rgb(25, 184, 173);
      line-height: 2;
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    }
    ::-webkit-input-placeholder {
        text-align: center;
      }
      :-moz-placeholder {
        text-align: center;
      }
  </style>