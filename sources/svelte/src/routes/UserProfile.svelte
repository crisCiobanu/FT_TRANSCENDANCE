<script lang="ts">
  import { onMount } from 'svelte';
  import {
    other_level,
    logged,
    other_losses,
    other_username,
    other_wins,
    other_image_url,
    other_firstname,
    other_lastname,
  } from '../stores.js';
</script>

<main>
  {#if $logged == 'true'}
    <div style="margin: 0 auto; display: block">
      <h1 class="name" style="color:darkred">{$other_username}</h1>
      <img
        class="profile"
        src={$other_image_url}
        width="200px"
        alt="Default Profile"
      />
    </div>
    <div>
      <p
        style="text-align:center; color:grey; font-weight:500; font-style: italic"
      >
        {$other_firstname}
        {$other_lastname}<br />
      </p>
    </div>

    <div class='buttons'>
      <button class="friend">Add as friend</button>
      <button class="block">Block user</button>
    </div>

    <div class="tb1">
      <h1
        style="width: 400px;background-color: darkgrey; color:white;text-decoration-line: underline;text-underline-offset: 20px;"
      >
        SCORES
      </h1>
      <h1>
        <span class="sp1">wins</span>
        <span class="sp2"> {$other_wins}</span><span class="sp1"
          >&emsp;&emsp;&emsp;losses</span
        > <span class="sp2">{$other_losses}</span><span class="sp1"
          >&emsp;&emsp;&emsp;level</span
        ><span class="sp2"> {$other_level}</span>
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
    background-color:dodgerblue;
    color: white;
    padding: 10px;
    /* margin: 0 auto; */
    display: flex;
  }

  .block {
    flex-direction: column;
    background-color: darkred;
    color:white;
    padding: 10px;
    /* margin: 0 auto; */
    display: flex;
  }
</style>
