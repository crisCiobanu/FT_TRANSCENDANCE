<script lang="ts">
  import {
    logged,
    username,
    otherUser,
    image_url,
    username42,
    id,
    cookie,
    TWOFA,
    ownmail,
    email,
    currentChat,
    currentProfile,
    currentPage,
  } from '../stores.js';

  import io, { Manager } from 'socket.io-client';
  import { onMount } from 'svelte';
  import { Puck, Paddle } from '../utils.js';
  import { tweened } from 'svelte/motion';

  export let socket: any = null;
  let games: any = [];
  let otherPlayer: any;
  let playerTwo;
  let ingame = 'false';
  let gameName: string;
  let scoreRight: number;
  let scoreLeft: number;
  let endGame: string = 'false';
  let myPaddle: string = '';
  let won: string = '';
  let lost: string = '';
  let theme = 1;


  const canvasWidth: number = 500;
  const canvasHeight: number = 320;
  const padding: number = 10;
  const margin: number = 5;
  const border: number = 5;

  const width: number = canvasWidth - margin * 2;
  const height: number = canvasHeight - margin * 2;

  const puckRadius: number = 7;

  const paddleWidth: number = 15;
  const paddleHeight: number = 70;

  let puck: any = new Puck({ x: width / 2, y: height / 2, r: puckRadius });

  let paddleLeft: any = new Paddle({
    x: padding,
    y: height / 2 - paddleHeight / 2,
    w: paddleWidth,
    h: paddleHeight,
    keys: {
      KeyW: -1,
      KeyS: 1,
    },
  });

  let paddleRight: any = new Paddle({
    x: width - padding - paddleWidth,
    y: height / 2 - paddleHeight / 2,
    w: paddleWidth,
    h: paddleHeight,
    keys: {
      ArrowUp: -1,
      ArrowDown: 1,
    },
  });

  let canvas: any, context: any;
  let playing: boolean, animationId: any;

  onMount(() => {
    context = canvas.getContext('2d');
    context.translate(margin, margin);
    if (ingame == 'true') {
      draw();
    }

    return () => {
      cancelAnimationFrame(animationId);
    };
  });

  const draw = () => {
    context.clearRect(0, 0, width, height);

    if (theme == 1) {
      context.strokeStyle = 'hsl(0, 0%,50%)';
    } else if (theme == 2) {
      context.strokeStyle = 'white';
    }
    else {
      context.strokeStyle = 'white';
    }
    context.lineWidth = border * 2;
    context.strokeRect(500, 500, width, height);
    if (theme == 1) {
      context.fillStyle = 'black';
    } else if (theme == 2) {
      context.fillStyle = 'slategrey';
    } else {
      context.fillStyle = 'darkred';
    }
    context.fillRect(0, 0, width, height);

    context.lineWidth = border;
    context.beginPath();
    context.moveTo(width / 2, 0);
    context.lineTo(width / 2, height);
    context.closePath();
    context.stroke();

    context.fillStyle = 'hsl(0, 0%, 100%)';
    context.fillStyle = 'white';
    puckshow(context, puck);
    if (theme == 1) {
    context.fillStyle = 'white';
    } else if (theme == 2) {
      context.fillStyle = 'white';
    } else {
      context.fillStyle = 'white';
    }
    paddleshow(context, paddleLeft);
    paddleshow(context, paddleRight);
  };

  function puckshow(context, ball) {
    const { x, y, r, startAngle, endAngle } = ball;
    // context.beginPath();
    context.arc(x, y, r, startAngle, endAngle);
    // context.closePath();
    context.fill();
  }

  function paddleshow(context, paddle) {
    const { x, y, w, h } = paddle;
    context.fillRect(x, y, w, h);
  }

  const handleKeydown = (e) => {
    if (!myPaddle) {
      return;
    }
    // const { code } = e;
    if (e.keyCode == 40) {
      socket.emit('keyDown', { name: gameName, pos: myPaddle, dy: 1 });
    }
    if (e.keyCode == 38) {
      socket.emit('keyDown', { name: gameName, pos: myPaddle, dy: -1 });
    }
  };

  const handleKeyup = (e) => {
    if (!myPaddle) {
      return;
    }
    if (e.keyCode == 40) {
      socket.emit('keyUp', { name: gameName, pos: myPaddle, dy: 1 });
    }
    if (e.keyCode == 38) {
      socket.emit('keyUp', { name: gameName, pos: myPaddle, dy: -1 });
    }
  };

  const handleStart = () => {
    if (playing) return;
    socket.emit('ready', { name: gameName });
    playing = true;
  };

  function changeTheme() {
    theme == 3 ? theme = 1 : theme += 1;
    draw();
  }

  function initGame(game) {
    puck = game.ball;
    paddleLeft = game.leftPaddle;
    paddleRight = game.rightPaddle;
    scoreLeft = game.leftPaddle.score;
    scoreRight = game.rightPaddle.score;
  }

  async function gameRequest() {
    ingame = 'waiting';
    socket.emit('waiting');
  }

  function watchGame() {
    socket.emit('watchGame', {});
  }

  function forfeit() {
    socket.emit('forfeit', { game: gameName });
    context.clearRect(0, 0, width, height);
    ingame = 'false';
    playing = false;
    alert('⚠️ Your abandon will be counted as a loss');
  }

  onMount(async () => {
    currentPage.update(n=> 'pong')
    socket = io('http://localhost:3000/pong', {
      auth: { token: $cookie },
    });

    socket.on('foundPeer', async (game) => {
      gameName = game.game.name;
      myPaddle =
        game.game.leftPaddle.userId == $id ? 'leftpaddle' : 'rightpaddle';
      otherPlayer = await fetch(
        'http://localhost:3000/users/' + game.opponentId,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Authorization: 'Bearer ' + $cookie,
            'Content-type': 'application/json; charset=UTF-8',
          },
        },
      ).then((response) => (otherPlayer = response.json()));
      initGame(game.game);
      ingame = 'true';
      draw();
    });

    socket.on('updateGame', (game) => {
      if (ingame == 'true') {
        puck = game.ball;
        paddleLeft = game.leftPaddle;
        paddleRight = game.rightPaddle;
        draw();
        scoreLeft = game.leftPaddle.score;
        scoreRight = game.rightPaddle.score;
        if (scoreLeft >= 3 || scoreRight >= 3) {
          scoreLeft >= 3 ? scoreLeft = scoreLeft += 1 : scoreRight += 1;
          playing = false;
          context.clearRect(0, 0, width, height);
          ingame = 'endgame';
          if (myPaddle == 'rightpaddle' && scoreRight >= 3) {
            alert(
              '🍾 🍾 🍾 Congratulations for you victory, your level is now higher!',
            );
          } else if (myPaddle == 'leftpaddle' && scoreLeft >= 3) {
            alert(
              '🍾 🍾 🍾 Congratulations for you victory, your level is now higher!',
            );
          } else {
            alert("🦆 🦆 🦆 Too bad! You'll play better next time!");
          }
          scoreLeft = 0;
          scoreRight = 0;
        }
      }
    }
    );
    socket.on('winByForfeit', () => {
      ingame = 'endgame';
      playing = false;
      alert('Your opponent forfeited the game. You are the winner');
      context.clearRect(0, 0, width, height);
    });
    socket.on('winByDisconnect', () => {
      ingame = 'endgame';
      playing = false;
      alert('Your opponnent disconnected. You are the winner')
      context.clearRect(0, 0, width, height);
    })
  });
</script>

<svelte:body on:keydown={handleKeydown} on:keyup={handleKeyup} />
{#if ingame == 'false'}
  <div class="homescreen">
    <img
      on:click={gameRequest}
      class="play_svg"
      src="img/play.svg"
      alt="play_logo"
    /><br /><br />
    <button on:click={gameRequest} class="play">▶︎</button>
    <button
      style="margin:0 auto; display:block;"
      on:click={() => {
        ingame = 'endgame';
      }}>test</button
    >
  </div>
{:else if ingame == 'waiting'}
  <div class="homescreen">
    <h2 style="color:white; text-align: center; padding-top:150px;">
      Waiting for other players...
    </h2>
    <button
      on:click={() => {
        ingame = 'false';
      }}
      class="cancel_button">Cancel</button
    >
    <button
      on:click={() => {
        ingame = 'true';
        draw();
      }}
      class="cancel_button">Play</button
    >
  </div>
{:else if ingame == 'endgame'}
  <div class="endgame">
    <h2 style="padding-top: 150px;">
      Match is over<br />Thank you for participating
    </h2>
    <button on:click={() => (ingame = 'false')} class="play_again"
      >Play again</button
    >
  </div>
{:else}
  <div class="game">
    <article>
      <div style="margin-top: 200px">
        <strong>
          {paddleLeft.score}
        </strong>
        {#if !playing}
          <button on:click={handleStart}> Play </button>
        {:else}
          <button
            style="border:none; background:transparent"
            on:click={handleStart}
          />
        {/if}
        <strong>
          {paddleRight.score}
        </strong>
      </div>
    </article>
  </div>
{/if}
<canvas bind:this={canvas} width={canvasWidth} height={canvasHeight} />
{#if ingame == 'true'}
  <div style="display: flex; margin: 0 auto; width: 400px;">
    {#if theme == 1}
    <button on:click={changeTheme} class='theme_button1'>Change theme</button>
    {:else if theme == 2}
    <button on:click={changeTheme} class='theme_button2'>Change theme</button>
    {:else}
    <button on:click={changeTheme} class='theme_button3'>Change theme</button>
    {/if}
    <button on:click={forfeit} class="forfeit_button">Forfeit the game</button>
  </div>
  <div
    style="display: block; margin:0 auto; align-items:center;     
    display: flex;
    align-items: center;
    margin-top:50px;
    margin-bottom: 50px;
    text-align: center;
    width: 700px;
    height: 200px;
    border-top: 2px dotted black;
    border-bottom: 2px dotted black;"
  >
    {#if myPaddle == 'leftpaddle'}
      <div style="display:block;  margin:0 auto;">
        <img
          class="player1_picture"
          src={$image_url}
          alt="player1_profile_picture"
        />
        <!-- <p style="color: black;">{$username}</p> -->
      </div>
      {#if gameName}
        <h3 style="text-align:center; color: black;">
          {gameName.split(' ')[0] == $username42
            ? gameName.split(' ')[0] + ' - ' + gameName.split(' ')[2]
            : gameName.split(' ')[2] + ' - ' + gameName.split(' ')[0]}
        </h3>
      {/if}
      <div style="display:block;  margin:0 auto;">
        <img
          class="player1_picture"
          src={otherPlayer.imageURL}
          alt="player1_profile_picture"
        />
        <!-- <p style="color: black;">{otherPlayer.userName}</p> -->
      </div>
    {:else if myPaddle == 'rightpaddle'}
      <div style="display:block;  margin:0 auto;">
        <img
          class="player1_picture"
          src={otherPlayer.imageURL}
          alt="player1_profile_picture"
        />
        <!-- <p style="color: black;">{otherPlayer.userName}</p> -->
      </div>
      {#if gameName}
        <h3 style="text-align:center; color: black;">
          {gameName.split(' ')[0] == $username42
            ? gameName.split(' ')[2] + ' - ' + gameName.split(' ')[0]
            : gameName.split(' ')[0] + ' - ' + gameName.split(' ')[2]}
        </h3>
      {/if}
      <div style="display:block;  margin:0 auto;">
        <img
          class="player1_picture"
          src={$image_url}
          alt="player1_profile_picture"
        />
        <!-- <p style="color: black;">{$username}</p> -->
      </div>
    {/if}
  </div>
{:else}
  <h1 style="margin-top: -450px;color:black; text-align:center">
    Watch live games
  </h1>
  {#if games.length == 0}
    <h3 style="color:dimgrey; font-style:italic; text-align:center">
      No live games to watch at the moment
    </h3>
  {:else}
    {#each games as game}
      <button on:click={watchGame} class="liveGame">
        {game.name}<br /><br />🏓 🏓 🏓
      </button>
    {/each}
  {/if}
{/if}

<style>
  :global(body) {
    color: hsl(210, 0%, 96%);
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
      sans-serif;
  }

  .game {
    display: block;
    margin: 0 auto;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
      sans-serif;
  }

  article {
    display: inline-block;
    position: relative;
    color: hsl(200, 0%, 95%);
    padding-left: 0;
    padding-right: 0;
    margin-left: auto;
    margin-right: auto;
    display: block;
    width: 800px;
  }

  article > div {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  div {
    display: grid;
    grid-template-columns: 1fr 0 1fr;
    justify-items: center;
    align-items: center;
  }

  canvas {
    padding-left: 0;
    padding-right: 0;
    margin-left: auto;
    margin-right: auto;
    display: block;
    width: 800px;
  }

  strong {
    font-size: 3rem;
  }

  button {
    font-weight: 700;
    font-family: sans-serif;
    /* text-transform: uppercase; */
    font-size: 0.9rem;
    padding: 0.3rem 0.8rem;
    border-radius: 0.25rem;
    border: none;
    color: hsl(201, 100%, 96%);
    background: hsl(200, 0%, 10%);
    border: 0.2rem solid currentColor;
    accent-color: currentColor;
  }

  .homescreen {
    margin: 0 auto;
    margin-top: 50px;
    display: block;
    height: 450px;
    width: 800px;
    background-color: black;
  }
  .play {
    cursor: pointer;
    margin: 0 auto;
    display: block;
    background-color: transparent;
    border: none;
    color: white;
    font-size: 100px;
    transition: transform 0.1s;
  }
  .play:hover {
    transform: scale(1.2);
  }

  .play_svg {
    cursor: pointer;
    width: 200px;
    padding-top: 100px;
    display: block;
    margin: 0 auto;
  }

  .cancel_button {
    background-color: transparent;
    border: solid 1px white;
    color: white;
    display: block;
    margin: 0 auto;
    margin-top: 30px;
    transition: transform 0.1s;
  }

  .cancel_button:hover {
    transform: scale(1.2);
    color: white;
    background-color: darkred;
    border: none;
  }

  .player1_picture {
    width: 100px;
    border: solid 3px black;
    height: 100px;
    margin-bottom: 10px;
    border-radius: 50%;
    display: block;
    margin: 0 auto;
  }

  .liveGame {
    background-image: linear-gradient(
      to right,
      #000000 0%,
      rgb(106, 106, 106) 51%,
      #d3d3d3 100%
    );
    margin: 10px;
    padding: 15px 45px;
    text-align: center;
    text-transform: uppercase;
    transition: 0.5s;
    background-size: 200% auto;
    color: white;
    border-radius: 10px;
    display: block;
    margin: 0 auto;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
      sans-serif;
    font-weight: 500;
  }

  .liveGame:hover {
    background-position: right center;
    color: #fff;
    text-decoration: none;
  }

  .endgame {
    margin: 0 auto;
    margin-top: 50px;
    display: block;
    height: 450px;
    width: 800px;
    text-align: center;
    background-color: black;
  }

  .play_again {
    background-color: transparent;
    border: solid 1px white;
    color: white;
    display: block;
    margin: 0 auto;
    margin-top: 30px;
    transition: transform 0.1s;
    padding: 10px;
  }

  .forfeit_button {
    margin: 0 auto;
    text-align: center;
    display: block;
    background-color: darkred;
    color: white;
    padding: 10px;
    cursor: pointer;
    border-radius: 10px;
  }

  .theme_button1 {
    margin: 0 auto;
    text-align: center;
    display: block;
    background-color: slategrey;
    color: white;
    padding: 10px;
    cursor: pointer;
    border-radius: 10px;
  }
  .theme_button2 {
    margin: 0 auto;
    text-align: center;
    display: block;
    background-color: darkred;
    color: white;
    padding: 10px;
    cursor: pointer;
    border-radius: 10px;
  }
  .theme_button3 {
    margin: 0 auto;
    text-align: center;
    display: block;
    background-color: black;
    color: white;
    padding: 10px;
    cursor: pointer;
    border-radius: 10px;
  }
</style>
