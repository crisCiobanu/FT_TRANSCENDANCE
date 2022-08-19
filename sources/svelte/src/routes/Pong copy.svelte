<script lang='ts'>
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
  } from '../stores.js';

  import io from 'socket.io-client';
  import { onMount } from 'svelte';
  import { Puck, Paddle, map } from '../utils.js';
  import { tweened } from 'svelte/motion';

  export let socket = null;
  let games = [];
  let otherPlayer;
  let playerTwo;
  let ingame = 'false';

  const tween = tweened(0);

  const canvasWidth = 500;
  const canvasHeight = 320;
  const padding = 10;
  const margin = 5;
  const border = 5;

  const width = canvasWidth - margin * 2;
  const height = canvasHeight - margin * 2;

  const puckRadius = 7;

  const paddleWidth = 15;
  const paddleHeight = 70;

  const puck = new Puck({ x: width / 2, y: height / 2, r: puckRadius });

  const paddleLeft = new Paddle({
    x: padding,
    y: height / 2 - paddleHeight / 2,
    w: paddleWidth,
    h: paddleHeight,
    keys: {
      KeyW: -1,
      KeyS: 1,
    },
  });
  const paddleRight = new Paddle({
    x: width - padding - paddleWidth,
    y: height / 2 - paddleHeight / 2,
    w: paddleWidth,
    h: paddleHeight,
    keys: {
      ArrowUp: -1,
      ArrowDown: 1,
    },
  });

  let canvas, context;
  let playing, animationId;

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

    context.strokeStyle = 'hsl(0, 0%,50%)';
    context.lineWidth = border * 2;
    context.strokeRect(500, 500, width, height);
    context.fillStyle = 'hsl(0, 0%, 0%)';
    context.fillRect(0, 0, width, height);

    context.lineWidth = border;
    context.beginPath();
    context.moveTo(width / 2, 0);
    context.lineTo(width / 2, height);
    context.closePath();
    context.stroke();

    context.fillStyle = 'hsl(0, 0%, 100%)';
    puck.show(context);

    context.fillStyle = 'hsl(0, 0%, 100%)';
    paddleLeft.show(context);
    paddleRight.show(context);
  };

  const handleStart = () => {
    if (playing) return;

    playing = true;
    puck.start();
    update();
  };

  const handleKeydown = (e) => {
    const { code } = e;

    if (paddleLeft.keys[code]) {
      paddleLeft.dy = paddleLeft.keys[code];
    } else if (paddleRight.keys[code]) {
      paddleRight.dy = paddleRight.keys[code];
    } else return;

    e.preventDefault();
  };

  const handleKeyup = (e) => {
    const { code } = e;

    if (paddleLeft.keys[code]) {
      paddleLeft.dy = 0;
    } else if (paddleRight.keys[code]) {
      paddleRight.dy = 0;
    } else return;

    e.preventDefault();
  };

  const update = () => {
    animationId = requestAnimationFrame(update);

    draw();

    puck.update();
    paddleLeft.update();
    paddleRight.update();

    // puck bounces against wall
    if (puck.y - puck.r < 0) {
      puck.y = puck.r;
      puck.dy *= -1;
    } else if (puck.y + puck.r > height) {
      puck.y = height - puck.r;
      puck.dy *= -1;
    }

    // puck bounces against paddles
    if (puck.collides(paddleLeft)) {
      puck.speed *= 1.025;

      const y = (puck.y - paddleLeft.y) / paddleLeft.h;
      if (y < 0) {
        puck.dy = -1;
        puck.y = paddleLeft.y - puck.r;
      } else if (y > 1) {
        puck.dy = 1;
        puck.y = paddleLeft.y + paddleLeft.h + puck.r;
      } else {
        puck.x = paddleLeft.x + paddleLeft.w + puck.r;

        const maxAngle = 90;
        const angles = 4;
        const angle = Math.round(map(y, 0, 1, 0, angles));
        const theta = ((angle * (maxAngle / angles) - 45) / 180) * Math.PI;

        const dx = Math.cos(theta) * puck.speed;
        const dy = Math.sin(theta) * puck.speed;

        puck.dx = dx;
        puck.dy = dy;
      }
    } else if (puck.collides(paddleRight)) {
      puck.speed *= 1.025;

      const y = (puck.y - paddleRight.y) / paddleRight.h;
      if (y < 0) {
        puck.dy = -1;
        puck.y = paddleRight.y - puck.r;
      } else if (y > 1) {
        puck.dy = 1;
        puck.y = paddleRight.y + paddleRight.h + puck.r;
      } else {
        puck.x = paddleRight.x - puck.r;

        const maxAngle = 90;
        const angles = 4;
        const angle = Math.round(map(y, 0, 1, 0, angles));
        const theta = ((angle * (maxAngle / angles) - 45) / 180) * Math.PI;

        const dx = Math.cos(theta) * puck.speed;
        const dy = Math.sin(theta) * puck.speed;

        puck.dx = dx * -1;
        puck.dy = dy;
      }
    }

    // puck exceeds horizontal constraints
    if (puck.x < -puck.r || puck.x > width + puck.r) {
      if (puck.x < width / 2) {
        paddleRight.score += 1;
      } else {
        paddleLeft.score += 1;
      }

      reset();
    }

    // paddles exceed vertical constraints
    if (paddleLeft.y < 0) {
      paddleLeft.y = 0;
      paddleLeft.dy = 0;
    } else if (paddleLeft.y > height - paddleLeft.h) {
      paddleLeft.y = height - paddleLeft.h;
      paddleLeft.dy = 0;
    }

    if (paddleRight.y < 0) {
      paddleRight.y = 0;
      paddleRight.dy = 0;
    } else if (paddleRight.y > height - paddleRight.h) {
      paddleRight.y = height - paddleRight.h;
      paddleRight.dy = 0;
    }
  };

  const reset = async () => {
    cancelAnimationFrame(animationId);

    const paddleLeftGap = paddleLeft.y - paddleLeft.y0;
    const paddleRightGap = paddleRight.y - paddleRight.y0;

    await tween.set(1, {
      interpolate: (to, from) => (t) => {
        paddleLeft.y = paddleLeft.y0 + paddleLeftGap * (1 - t);
        paddleRight.y = paddleRight.y0 + paddleRightGap * (1 - t);
        draw();
        return (from - to) * t;
      },
    });

    puck.reset();
    draw();
    tween.set(0, { duration: 0 });
    playing = false;
    handleStart();
  };


 async function gameRequest() {
    ingame = 'waiting';
    socket.emit('waiting');
  }

  function watchGame() {
    socket.emit('watchGame', {

    })
  }


  onMount(async () => {
    socket = io('http://localhost:3000/pong', {
      auth: { token: $cookie },
    });

    socket.on('foundPeer', async (game) => {
      alert('foundPeer');
      otherPlayer =  await fetch('http://localhost:3000/users/' + game.opponentId, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
    }).then((response) => (otherPlayer = response.json()));
      
      ingame = 'true';
      draw();
    });
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
  <div
    style="display: block; margin:0 auto; align-items:center;     
    display: flex;
    align-items: center;
    margin-bottom: 50px;
    text-align: center;;"
  >
    <div style="display:block;  margin:0 auto;">
      <img
        class="player1_picture"
        src={$image_url}
        alt="player1_profile_picture"
      />
      <p style="color: black;">{$username}</p>
    </div>
    <div style="display:block;  margin:0 auto;">
      <img
        class="player1_picture"
        src={otherPlayer.imageURL}
        alt="player1_profile_picture"
      />
      <p style="color: black;">{otherPlayer.userName}</p>
    </div>
  </div>
{:else}
  <h1 style="margin-top: -450px;color:black; text-align:center">
    Watch live games
  </h1>
{#if games.length == 0}
<h3 style='color:dimgrey; font-style:italic; text-align:center'>No live games to watch at the moment</h3>
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
    text-transform: uppercase;
    font-size: 0.9rem;
    padding: 0.3rem 0.8rem;
    border-radius: 0.25rem;
    border: none;
    color: hsl(201, 100%, 96%);
    background: hsl(200, 0%, 10%);
    border: 0.2rem solid currentColor;
    accent-color: currentColor;
  }

  /* button:active {
    color: hsl(330, 79%, 56%);
    background: currentColor;
  } */

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
      /* #2764b3 51%, */
      rgb(106, 106, 106) 51%,
      /* #6d1010 51% */
      #d3d3d3 100%
    );
    margin: 10px;
    padding: 15px 45px;
    text-align: center;
    text-transform: uppercase;
    transition: 0.5s;
    background-size: 200% auto;
    color: white;
    /* box-shadow: 0 0 20px #eee; */
    border-radius: 10px;
    display: block;
    margin: 0 auto;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    font-weight: 500;
  }

  .liveGame:hover {
    background-position: right center; 
    color: #fff;
    text-decoration: none;
  }
</style>
