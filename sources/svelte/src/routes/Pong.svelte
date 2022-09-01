<script lang="ts">
  import {
    image_url,
    username42,
    id,
    cookie,
    currentPage,
    invitedPlayer,
    invitation,
    logged,
  } from '../stores.js';

  import io, { Manager } from 'socket.io-client';
  import { onMount } from 'svelte';
  import { onDestroy } from 'svelte';
  import { beforeUpdate } from 'svelte';
  import { afterUpdate } from 'svelte';
  // import { Puck, Paddle } from '../utils.js';
  import socketGlobal from '../App.svelte'
import App from '../App.svelte';

const FRONTEND_URL = 'http://localhost:8080';
const BACKEND_URL  = 'http://localhost:3000';

class Puck {
    x:any;
    x0:any;
    y:any
    y0: any;
    r: any;
    startAngle: any;
    endAngle: any;
    dx: any;
    dy: any;
    initialSpeed: any;
    speed: any;
	constructor({ x, y, r, speed = 3 }) {
		this.x = x;
		this.x0 = x;
		this.y = y;
		this.y0 = y;
		this.r = r;
		this.startAngle = 0;
		this.endAngle = Math.PI * 2;
		this.dx = 0;
		this.dy = 0;
		this.initialSpeed = speed;
		this.speed = speed;
	}
}

class Paddle {
  x:any;
		y:any;
		w:any;
		h:any;
		y0:any;
		dy:any;
		speed:any;
		keys:any;
		score:any;
	constructor({ x, y, w, h, keys, speed = 3.5, score = 0 }) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.y0 = y;
		this.dy = 0;
		this.speed = speed;
		this.keys = keys;
		this.score = score;
	}
}

  export let socket: any = null;
  let invitedPlayer_two;
  let invitation_two;
  let games: any = [];
  let otherPlayer: any;
  let currentGame: any;
  let ingame = 'false';
  let gameId: string;
  let gameName: string;
  let scoreRight: number;
  let scoreLeft: number;
  let myPaddle: string = '';
  let theme: number = 1;
  let invitingPlayer: string;
  let invited: string = 'false';
  let allGames: any;
  let newInvite: string = 'false';
  let pause: string = 'false';
  let time: string = 'Game paused, 10 seconds remaining';
  let retour: string = 'false';

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
    } else {
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
    context.arc(x, y, r, startAngle, endAngle);
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
    if (e.keyCode == 40) {
      socket.emit('keyDown', { gameId: gameId, pos: myPaddle, dy: 1 });
    }
    if (e.keyCode == 38) {
      socket.emit('keyDown', { gameId: gameId, pos: myPaddle, dy: -1 });
    }
  };

  const handleKeyup = (e) => {
    if (!myPaddle) {
      return;
    }
    if (e.keyCode == 40) {
      socket.emit('keyUp', { gameId: gameId, pos: myPaddle, dy: 1 });
    }
    if (e.keyCode == 38) {
      socket.emit('keyUp', { gameId: gameId, pos: myPaddle, dy: -1 });
    }
  };

  const handleStart = () => {
    if (playing) return;
    socket.emit('ready', { gameId: gameId });
    playing = true;
  };

  function changeTheme() {
    theme == 3 ? (theme = 1) : (theme += 1);
    draw();
  }

  function cancelGame() {
    ingame = 'false';
    socket.emit('cancelGame');
  }

  function cancelGameInvitation() {
    ingame = 'false';
    socket.emit('cancelInvite');
    invitation.update((n) => '');
    invitedPlayer.update((n) => '');
  }

  function initGame(game) {
    puck = game.ball;
    paddleLeft = game.leftPaddle;
    paddleRight = game.rightPaddle;
    scoreLeft = game.leftPaddle.score;
    scoreRight = game.rightPaddle.score;
  }

  function declinedResponse() {
    alert('Your invitaton has been declined');
    ingame = 'false';
    invited = 'false';
    invitation.update((n) => '');
  }

  async function gameRequest() {
    ingame = 'waiting';
    socket.emit('waiting');
  }

  async function acceptInvite() {
    socket.emit('acceptInvite');
    invited = 'false';
  }

  function declineInvite() {
    socket.emit('declineInvite');
    invited = 'false';
  }

  async function watchGame(game) {
    currentGame = game;
    socket.emit('watchGame', { gameId: game.id });
  }

  function forfeit() {
    socket.emit('forfeit', { gameId: gameId });
    context.clearRect(0, 0, width, height);
    ingame = 'false';
    playing = false;
    alert('⚠️ Your abandon will be counted as a loss');
  }

function countdownTimer() {
    retour = 'false';
    var timeleft = 9;
    var downloadTimer = setInterval( async function () {
      if (retour == 'true') {
        timeleft = 9;
        return;
      }
      if (timeleft <= 0) {
        clearInterval(downloadTimer);
        time = '0';
        time = time;
        pause = 'false';
        if (myPaddle) {
          ingame = 'endgame';
          socket.emit('wonByTimeOut', { gameId: gameId });
        }
        if (!myPaddle) {
          alert('Match is over because one of the two players disconnected');
            allGames = await fetch(`${BACKEND_URL}/pong/games`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                Authorization: 'Bearer ' + $cookie,
                'Content-type': 'application/json; charset=UTF-8',
              },
            }).then((response) => (allGames = response.json()));
            games = allGames;
            context.clearRect(0, 0, width, height);
            ingame = 'false';
            playing = false;
            window.location.replace(`${FRONTEND_URL}/#/pong`);
        }
        return;
      } else {
        time = 'Game paused, ' + timeleft + ' seconds remaining';
        time = time;
      }
      timeleft -= 1;
    }, 1000);
  }

  onMount(async () => {
    currentPage.update((n) => 'pong');

    if ($logged == 'true') {
      socket = io(`${BACKEND_URL}/pong`, {
        auth: { token: $cookie },
      });
    }

    socket.on('invitationRequest', (player) => {
      invitingPlayer = player;
      invited = 'true';
      alert('You received a new invitation to play Pong!');
    });

    socket.on('liveInvitationRequest', (player) => {
      invitingPlayer = player;
      newInvite = 'true';
    });

    socket.on('foundPeer', async (game) => {
      gameId = game.game.id;
      gameName = game.game.name;
      myPaddle =
        game.game.leftPaddle.userId == $id ? 'leftpaddle' : 'rightpaddle';
      otherPlayer = await fetch(
        `${BACKEND_URL}/users/` + game.opponentId,
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

    socket.on('updateGame', async (game) => {
      if (ingame == 'true' || ingame == 'watch') {
        gameName = game.name;
        puck = game.ball;
        paddleLeft = game.leftPaddle;
        paddleRight = game.rightPaddle;
        draw();
        scoreLeft = game.leftPaddle.score;
        scoreRight = game.rightPaddle.score;
        if (scoreLeft >= 3 || scoreRight >= 3) {
          scoreLeft >= 3 ? (scoreLeft = scoreLeft += 1) : (scoreRight += 1);
          playing = false;
          context.clearRect(0, 0, width, height);
          if (ingame == 'watch') {
            alert('Match is over, you will be redirected to the lobby');
            context.clearRect(0, 0, width, height);
            allGames = await fetch(`${BACKEND_URL}/pong/games`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                Authorization: 'Bearer ' + $cookie,
                'Content-type': 'application/json; charset=UTF-8',
              },
            }).then((response) => (allGames = response.json()));
            games = allGames;
            ingame = 'false';
            playing = false;
            window.location.replace(`${FRONTEND_URL}/#/pong`);
            return;
          }
          ingame = 'endgame';
          if (myPaddle == 'rightpaddle' && scoreRight >= 3) {
            alert(
              '🍾 Congratulations for you victory, your level is now higher!',
            );
            allGames = await fetch(`${BACKEND_URL}/pong/games`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                Authorization: 'Bearer ' + $cookie,
                'Content-type': 'application/json; charset=UTF-8',
              },
            }).then((response) => (allGames = response.json()));
            games = allGames;
          } else if (myPaddle == 'leftpaddle' && scoreLeft >= 3) {
            alert(
              '🍾 Congratulations for you victory, your level is now higher!',
            );
            allGames = await fetch(`${BACKEND_URL}/pong/games`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                Authorization: 'Bearer ' + $cookie,
                'Content-type': 'application/json; charset=UTF-8',
              },
            }).then((response) => (allGames = response.json()));
            games = allGames;
          } else {
            alert("🦆 Too bad! You'll play better next time!");
            allGames = await fetch(`${BACKEND_URL}/pong/games`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                Authorization: 'Bearer ' + $cookie,
                'Content-type': 'application/json; charset=UTF-8',
              },
            }).then((response) => (allGames = response.json()));
            games = allGames;
          }
          scoreLeft = 0;
          scoreRight = 0;
        }
      }
    });

    socket.on('acceptInviteResponse', (message) => {
      if (message == 'noGame') {
        alert('This game has been canceled');
      }
    });

    socket.on('pausedGame', () => {
      pause = 'true';
      countdownTimer();
    });

    socket.on('comeBack', async (game) => {
      retour = 'true';
      gameId = game.game.id;
      myPaddle =
        game.game.leftPaddle.userId == $id ? 'leftpaddle' : 'rightpaddle';
      otherPlayer = await fetch(
        `${BACKEND_URL}/users/` + game.opponentId,
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
      socket.emit('ready', { gameId: gameId });
      playing = true;
      draw();
    });

    socket.on('wonByTimeOutResponse', () => {
      ingame = 'endgame';
      playing = false;
      context.clearRect(0, 0, width, height);
      alert('You opponent forfeited the match by disconnecting');
    });

    socket.on('resumeGame', () => {
      pause = 'false';
      retour = 'true';
      time = '10';
    });

    allGames = await fetch(`${BACKEND_URL}/pong/games`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
    }).then((response) => (allGames = response.json()));
    games = allGames;

    socket.on('winByForfeit', () => {
      ingame = 'endgame';
      playing = false;
      context.clearRect(0, 0, width, height);
      alert('Your opponent forfeited the game. You are the winner');
    });

    socket.on('winByDisconnect', () => {
      ingame = 'endgame';
      playing = false;
      alert('Your opponnent disconnected. You are the winner');
      context.clearRect(0, 0, width, height);
    });

    socket.on('declinedResponse', () => {
      declinedResponse();
    });

    socket.on('watchGameResponse', async (message) => {
      if (message == 'noGame') {
        alert('Ne game is no more available');
        allGames = await fetch(`${BACKEND_URL}/pong/games`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                Authorization: 'Bearer ' + $cookie,
                'Content-type': 'application/json; charset=UTF-8',
              },
            }).then((response) => (allGames = response.json()));
            games = allGames;
        }
      if (message == 'goWatchGame') {
        ingame = 'watch';
        draw();
        playing = true;
      }
    });

    if ($invitation == 'true') {
      socket.emit('inviteToGame', { userName42: $invitedPlayer });
      invitation_two = $invitation;
      invitedPlayer_two = $invitedPlayer;
      invitation.update((n) => 'false');
      invitedPlayer.update((n) => '');
      ingame = 'waiting';
    }

    socket.on('samePlayer', () => {
      ingame = 'false';
      alert("⚠️ You are already logged on another device. You can't play Pong on two devices at once");
    })
  });

  onDestroy(async () => {
    socket.emit('byebye');
  })
</script>

<svelte:body on:keydown={handleKeydown} on:keyup={handleKeyup} />
{#if newInvite == 'true'}
  {#if ingame != 'true'}
    <h3 style="color:slategrey; text-align: center;">
      You received a new invitation to play !!<br />Refresh the page to see who
      is challenging you
    </h3>
    {/if}
  {/if}
{#if pause == 'true'}
  <h2 id="countdown" style="text-align: center; color: darkred">{time}</h2>
{/if}
{#if $logged == 'true'}
  {#if ingame == 'watch'}
    <h2 style="color: black; text-align: center; font-style:italic">
      Watching Live
    </h2>
    {#if gameName}
      <h4 style="color: black; text-align: center;">{gameName}</h4>
    {/if}
  {/if}
  {#if ingame == 'false'}
    <div class="homescreen">
      {#if invited == 'true'}
        <div
          style="text-align:center; color:white; display: block;padding-top: 10vw;"
        >
          <h2 style='font-size:3vw'>
            <span style="color: rgb(224, 62, 62);">{invitingPlayer}</span> would
            like to play pong
          </h2>
          <div class="my-buttons">
            <button on:click|preventDefault={acceptInvite} id="accept">Accept</button>
            <button on:click|preventDefault={declineInvite} id="decline">Decline</button>
          </div>
        </div>
      {:else}
        <img
          on:click|preventDefault={gameRequest}
          class="play_svg"
          src="img/play.svg"
          alt="play_logo"
        /><br /><br />
        <button on:click|preventDefault={gameRequest} class="play">▶︎</button>
      {/if}
    </div>
  {:else if ingame == 'waiting'}
    <div class="homescreen">
      {#if invitation_two == 'true'}
        <h2 style="color:white; text-align: center; padding-top:15vw;font-size:3vw;">
          Waiting for <span style="color:dodgerblue">{invitedPlayer_two}</span
          >'s response...
        </h2>
        <button on:click|preventDefault={cancelGameInvitation} class="cancel_game_button"
          >Cancel invitation</button
        >
      {:else}
        <h2 style="color:white; text-align: center; padding-top:15vw;font-size: 3vw">
          Waiting for other players...
        </h2>
        <button on:click|preventDefault={cancelGame} class="cancel_button">Cancel</button>
      {/if}
    </div>
  {:else if ingame == 'endgame'}
    <div class="endgame">
      <h2 style="padding-top: 15vw; color: white;font-size: 3vw;">
        Match is over<br />Thank you for participating
      </h2>
      <button on:click|preventDefault={() => (ingame = 'false')} class="play_again"
        >Play again</button
      >
    </div>
  {:else}
    <div class="game">
      <article>
        <div style='margin-top: 15vw;'>
          <strong style='font-size:7vw'>
            {paddleLeft.score}
          </strong>
          {#if !playing}
            <button on:click|preventDefault={handleStart}> Play </button>
          {:else}
            <button
              style="border:none; background:transparent"
              on:click|preventDefault={handleStart}
            />
          {/if}
          <strong style='font-size:7vw'>
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
        <button on:click|preventDefault={changeTheme} class="theme_button1"
          >Change theme</button
        >
      {:else if theme == 2}
        <button on:click|preventDefault={changeTheme} class="theme_button2"
          >Change theme</button
        >
      {:else}
        <button on:click|preventDefault={changeTheme} class="theme_button3"
          >Change theme</button
        >
      {/if}
      <button on:click|preventDefault={forfeit} class="forfeit_button">Forfeit the game</button
      >
    </div>
    <div
      style="display: block; margin:0 auto; align-items:center;     
    display: flex;
    align-items: center;
    margin-top:50px;
    margin-bottom: 50px;
    text-align: center;
    width: 90vw;
    height: 20vw;
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
        </div>
      {:else if myPaddle == 'rightpaddle'}
        <div style="display:block;  margin:0 auto;">
          <img
            class="player1_picture"
            src={otherPlayer.imageURL}
            alt="player1_profile_picture"
          />
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
        </div>
      {/if}
    </div>
  {:else if ingame == 'false' && invited == 'false'}
    <h1 class='watchLive'>
      Watch live games
    </h1>
    {#if games.length == 0}
      <h3 id='noLiveGames'>
        No live games to watch at the moment
      </h3>
    {:else}
      {#each games as game}
        <button on:click|preventDefault={() => watchGame(game)} class="liveGame">
          {game.name}<br /><br />🏓 🏓 🏓
        </button>
      {/each}
    {/if}
  {/if}
{:else}
  <h1 style="color: black; text-align: center">ACCESS DENIED</h1>
{/if}

<style>
  :global(body) {
    /* background-color: red; */
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
      sans-serif;
    display: block;
    margin: 0 auto;
    /* align-items:center; */
  }

  .game {
    display: block;
    margin: 0 auto;
    min-width: 500px;
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
    width: 50vw;
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
    margin: 0 auto;
    display: block;
    width: 90vw;
    max-width: 1024px;
    min-width: 320px;
    object-fit: contain;
  }

  strong {
    font-size: 3rem;
  }

  button {
    font-weight: 700;
    font-family: sans-serif;
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
    margin-top: 5vw;
    display: block;
    background-color: black;
    aspect-ratio: 500/320;
    width: 90vw;
    max-width: 1024px;
    min-width: 320px;
    object-fit: contain;
  }
  .play {
    cursor: pointer;
    margin: 0 auto;
    display: block;
    background-color: transparent;
    border: none;
    color: white;
    font-size: calc(4em + 5vmin);
    transition: transform 0.1s;
  }
  .play:hover {
    transform: scale(1.2);
  }

  .play_svg {
    cursor: pointer;
    width: 25vw;
    max-width: 200px;
    padding-top: 8vw;
    display: block;
    margin: 0 auto;
  }

  .cancel_button {
    background-color: transparent;
    border: solid 1px white;
    color: white;
    display: block;
    margin: 0 auto;
    margin-top: 5vw;
    width: 10vw;
    text-align: center;
    font-size: 1.5vw;
    transition: transform 0.1s;
  }

  .cancel_game_button {
    background-color: transparent;
    border: solid 1px white;
    color: white;
    display: block;
    margin: 0 auto;
    margin-top: 5vw;
    width: 20vw;
    text-align: center;
    font-size: 1.5vw;
    transition: transform 0.1s;
  }

  .cancel_game_button:hover {
    transform: scale(1.2);
    color: white;
    background-color: darkred;
    border: none;
  }

  .cancel_button:hover {
    transform: scale(1.2);
    color: white;
    background-color: darkred;
    border: none;
  }

  .player1_picture {
    width: 12vw;
    height: 12vw;
    max-height: 150px;
    max-width: 150px;
    border: solid 3px black;
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
    margin-top: 10vw;
    display: block;
    aspect-ratio: 500/320;
    width: 90vw;
    max-width: 1024px;
    min-width: 320px;
    object-fit: contain;
    text-align: center;
    background-color: black;
  }

  .play_again {
    background-color: transparent;
    border: solid 1px white;
    border-radius: 5%;
    color: white;
    display: block;
    margin: 0 auto;
    font-size:2vw;
    margin-top: 5vw;
    transition: transform 0.1s;
    padding: 2vw;
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

  .my-buttons {
    cursor: pointer;
    display: flex;
    text-align: centers;
    width: 400px;
    margin: 0 auto;
  }

  #accept {
    cursor: pointer;
    display: flex;
    margin: 0 auto;
    border-radius: 5px;
    text-align: center;
    color: black;
    width: 9vw;
    font-size:1.5vw;
    background-color: white;
    transition: transform 0.1s;
  }

  #decline {
    cursor: pointer;
    display: flex;
    margin: 0 auto;
    border-radius: 5px;
    text-align: center;
    color: white;
    width: 9vw;
    font-size:1.5vw;
    background-color: black;
    transition: transform 0.1s;
  }

  .watchLive {
    margin-top: -50vw;
    color:black;
    text-align:center;
    font-size: 3vw
  }

  #accept:hover {
    transform: scale(1.1);
  }

  #decline:hover {
    transform: scale(1.1);
  }

  #noLiveGames {
    color:dimgrey; 
    font-style:italic; 
    text-align:center; 
    font-size: 2vw;
  }

  @media only screen and (min-width: 1000px) {
    .watchLive {
    margin-top: -45vh;
    color: black;
    text-align:center;
    font-size: calc(1.5em + 1vmin);
  }

  #noLiveGames {
    font-size: calc(1em + 1vmin);
  }
}

</style>
