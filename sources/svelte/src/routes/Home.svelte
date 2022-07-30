<script lang='ts'>
import { onMount } from 'svelte';
// import * as cookie from "cookie";
import { level, logged, losses, username, wins, image_url, firstname, lastname, id } from '../stores.js';
let isAuth;

// function updateAll (isAuth: any) {
//       logged.update(n => isAuth.logged);
//       username.update(n => isAuth.username);
//       wins.update(n => isAuth.wins);
//       losses.update(n => isAuth.losses);
//       level.update(n => isAuth.level);
//       image_url.update(n => isAuth.image_url);
//       firstname.update(n => isAuth.firstname);
//       lastname.update(n => isAuth.lastname);
//       console.log(isAuth);
//       //TODO: modify values in database;

// }

function updateAll (isAuth: any) {
      id.update(n => isAuth.id);
      logged.update(n => isAuth.logged);
      username.update(n => isAuth.username);
      firstname.update(n => isAuth.firstname);
      lastname.update(n => isAuth.lastname);
      wins.update(n => isAuth.wins);
      losses.update(n => isAuth.losses);
      level.update(n => isAuth.level);
      image_url.update(n => isAuth.image_url);

      console.log(isAuth);
      //TODO: modify values in database;

}

onMount(async () => {
  if ($logged)
  {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    console.log(code);
    console.log("A");
    if (code != null) 
    {
      isAuth = await fetch("http://localhost:3000/users/callback/", 
      {
        method: 'POST',
        headers: 
        {
         "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({"access_token": `${code}`,})
      }).then(response => isAuth = response.json());
        console.log(isAuth);
      if (isAuth.logged) 
      {
          console.log("logged");
          updateAll(isAuth);
      } 
    }
  }
   }
  );

</script>
<main>
  {#if $logged === 'true'}
  <h1 style="text-align: center; font-weight: 700; margin-top: 50px;">Just a bit of history...</h1>
    <div class="about">
      <p>Pong is a table tennis–themed twitch arcade sports video game,
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
    {:else}
    <a href="https://api.intra.42.fr/oauth/authorize?client_id=3e6e67d52700f32ea72111aee9b04403f78ba98745a76856cf11003de9399fa2&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2F&response_type=code" class="api">Connect with<br><img src="img/42_logo.png" width="40px" alt="42 logo"/>
                         
    </a>
    {/if}
</main>
  
  <style>
    main {
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    }
    @media (min-width: 1024px) {
      .about {
        align-items: center;
      }
    .about {
      color: balck;
      width: 50%;
      margin-top: 30px;;
      margin-left: auto;
      margin-right: auto;
      font-size: 18px;
      font-style: italic;
      font-weight: 300;
      line-height: 1.7;
    }
    .api {
      color: rgb(255, 255, 255);
      text-align: center;
      width: 100px;
      padding: 5px;
      padding-left:40px;
      padding-right: 40px;
      margin: 0 auto;
      align-items: center;
      align-content: center;
      display: block;
      margin-top: 30px;
      background-color: rgb(25, 184, 173);
      line-height: 2;
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    }
    }
  </style>