<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    level,
    logged,
    losses,
    username,
    wins,
    image_url,
    firstname,
    lastname,
    id,
    TWOFA,
    cookie,
    email,
    ownmail,
    otherUser,
    currentPage,
    username42,
    refresh,
  } from '../stores.js';
  import io, { Manager } from 'socket.io-client';

  let socket: any = null;
  let mail: string;
  let user;
  let newUserName: string = 'false';
  let newMail: string = 'false';
  let fileinput: any;
  let newImage: any;
  let friendArray: any = [];
  let myFriends: any;
  let friends = [];
  let newFriend: any;
  let myMatches: any;
  let matches = [];
  let userResponse;

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
  };

  function validateMailAddress() {
    if (validateEmail(mail)) {
      changeMailAddress();
    } else {
      alert('❌ Please enter a valid email address');
      mail = '';
    }
  }

  async function changeMailAddress() {
    if ($TWOFA == 'false') {
      await fetch('http://localhost:3000/users/twofa', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + $cookie,
        },
      });
      await fetch('http://localhost:3000/users/updatemail/', {
        method: 'POST',

        body: JSON.stringify({ id: $id, email: mail }),
        headers: {
          Authorization: 'Bearer ' + $cookie,
          'Content-type': 'application/json; charset=UTF-8',
        },
      });
      ownmail.update((n) => 'true');
      TWOFA.update((n) => 'true');
      email.update((n) => mail);
      alert('✅ Two factor authentification has been enalbled on this account');
      newMail = 'false';
    } else {
      alert('❌ Two factor authentication is already enabled!');
      newMail = 'false';
    }
  }

  function validateUserName() {
    if (user.length < 3) {
      alert('❌ New username must be at least 3 characters long');
    } else if (user.length > 6) {
      alert('❌ New username must not be longet than 6 characters long');
    } else if (user == $username) {
      alert(user + ' is already your username');
    } else {
      changeUserName();
    }
  }

  async function changeUserName() {
    userResponse = await fetch('http://localhost:3000/users/updateusername/', {
      method: 'POST',
      body: JSON.stringify({ username: user, id: $id }),
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
    }).then((response) => (userResponse = response.json()));
    if (userResponse.status == 'OK') {
      alert('✅ Your username has beem changed to ' + user);
      username.update((n) => user);
      newUserName = 'false';
      user = '';
    } else if (userResponse.status == 'KO') {
      alert('⚠️ user name has already been  chosen ! Pick another one');
      user = '';
    }
  }

  async function TWOFAon() {
    if ($TWOFA == 'false') {
      await fetch('http://localhost:3000/users/twofa', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + $cookie,
        },
      });
      TWOFA.update((n) => 'true');
      alert('✅ Two factor authentification has been enalbled on this account');
    } else {
      alert('❌ Two factor authentication is already enabled!');
    }
  }

  function onlyNumbers(str) {
    return /^[0-9]+$/.test(str);
  }

  async function TWOFAoff() {
    if ($TWOFA == 'true') {
      await fetch('http://localhost:3000/users/twofa', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + $cookie,
        },
      });
      TWOFA.update((n) => 'false');
      alert('✅ Two factor authentication has been disabled on this account');
    } else {
      alert('❌ Two factor authentication is already disabled!');
    }
  }

  async function onFileSelected(e) {
    let image = e.target.files[0];
    var data = new FormData();
    data.append('file', image);
    data.append('id', $id.toString());
    newImage = await fetch('http://localhost:3000/users/updateimage/', {
      method: 'post',
      body: data,
      headers: {
        Authorization: 'Bearer ' + $cookie,
      },
    }).then((response) => (newImage = response.json()));
    if (newImage.url) {
      image_url.update((n) => newImage.url);
    }
  }

  onMount(async () => {
    socket = io(`http://localhost:3000/profile`, {
      auth: { token: $cookie },
    });
    currentPage.update((n) => 'profile');
    myFriends = await fetch('http://localhost:3000/auth/currentuser', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
    }).then((response) => (myFriends = response.json()));
    friendArray = myFriends.friends;
    for (let i = 0; i < friendArray.length; i++) {
      if (parseInt(friendArray[i])) {
        newFriend = await fetch(
          'http://localhost:3000/users/' + friendArray[i],
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              Authorization: 'Bearer ' + $cookie,
              'Content-type': 'application/json; charset=UTF-8',
            },
          },
        ).then((response) => (newFriend = response.json()));
        friends = [...friends, newFriend];
      }
    }
    wins.update((n) => myFriends.wins);
    losses.update((n) => myFriends.losses);
    level.update((n) => myFriends.level.toFixed(1));
    myMatches = await fetch('http://localhost:3000/matches/getForUser', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ id: $id }),
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
    }).then((response) => (myMatches = response.json()));
    matches = myMatches;
    refresh.update((n) => 'true');
  });

  onDestroy(async () => {
    refresh.update((n) => 'false');
  });

  function redirect(arg0: string) {
    throw new Error('Function not implemented.');
  }
</script>

<main>
  {#if $logged == 'true'}
    {#if newUserName == 'true'}
      <div class="newUserName">
        <h2>Enter new username</h2>
        <div>
          <input
            style="width: 150px;"
            placeholder="Enter new username"
            type="text"
            minlength="3"
            maxlength="6"
            required
            bind:value={user}
          />
          <div>
            <button
              on:click|preventDefault={validateUserName}
              type="submit"
              value="Submit"
              style="cursor: pointer">Change</button
            >
          </div>
          <div />
          <div>
            <button
              style="cursor: pointer; font-size: 50px; border: none; background-color: transparent;"
              on:click|preventDefault={() => {
                newUserName = 'false';
              }}>🔙</button
            >
          </div>
        </div>
      </div>
    {:else if newMail == 'true'}
      <div class="newMail">
        <h2>Enter a private mail address</h2>
        <div>
          <input
            style="width: 150px;"
            type="email"
            required
            placeholder="Mail address"
            bind:value={mail}
          />
          <div>
            <button
              on:click|preventDefault={validateMailAddress}
              type="submit"
              value="Submit"
              style="cursor: pointer">Change</button
            >
          </div>
          <div />
          <div>
            <button
              style="cursor: pointer;font-size: 50px; border: none; background-color: transparent;"
              on:click|preventDefault={() => (newMail = 'false')}>🔙</button
            >
          </div>
        </div>
      </div>
    {:else}
      <div style="margin: 0 auto; display: block">
        <h1 class="name" style="color:darkred">{$username}</h1>
        <img
          class="profile"
          src={$image_url}
          width="200px"
          alt="Default Profile"
        />
        <button
          class="bt1"
          style="cursor: pointer"
          on:click|preventDefault={() => {
            fileinput.click();
          }}>Change profile picture</button
        >
        <input
          style="display:none"
          type="file"
          accept=".jpg, .jpeg, .png"
          on:change={(e) => onFileSelected(e)}
          bind:this={fileinput}
        />
      </div>
      <div>
        <p
          style="text-align:center; color:grey; font-weight:500; font-style: italic"
        >
          {$firstname}
          {$lastname}<br />{$email}
        </p>
      </div>
      <div style="margin: 0 auto; ">
        <button
          class="bt2"
          style="cursor: pointer"
          on:click|preventDefault={() => {
            newUserName = 'true';
            newMail = 'false';
          }}>Change user name</button
        >
        {#if $TWOFA == 'false'}
          <button
            class="TWOFA"
            on:click|preventDefault={() => (newMail = 'true')}
            style="cursor: pointer; margin: 0 auto;padding: 10px;width: 200px;color: white; background-color:lightslategrey;border-radius: 5px"
            >Enable 2FA</button
          >
        {:else}
          <button
            on:click|preventDefault={TWOFAoff}
            class="TWOFA"
            style="cursor: pointer; margin: 0 auto;padding: 10px; width: 200px; background-color: dimgrey; color: white; border-radius:5px;"
            >Disable 2FA</button
          >
        {/if}
      </div>
      <div class="tb1">
        <div style="width: 400px;margin: 0 auto; display: block">
          <h1
            style="text-align: center; width: 400px;background-color: darkgrey; color:white;text-decoration-line: underline;text-underline-offset: 20px;"
          >
            SCORES
          </h1>
        </div>
        <h1 style="text-transform: uppercase;">
          <p>
            <span class="sp1">wins</span> <span class="sp2">{$wins}</span>
            <span style="font-weight:300;"> | </span><span class="sp1"
              >losses</span
            > <span class="sp2">{$losses}</span>
            <span style="font-weight:300;"> | </span><span class="sp1"
              >level</span
            > <span class="sp2">{$level}</span>
          </p>
        </h1>
      </div>
      <div style="width: 400px;margin: 0 auto; display: block">
        <h1 style="background-color: darkgrey; color:white; text-align:center;">
          MATCH HISTORY
        </h1>
        <div style="display:block; margin: 0 auto; text-align: center">
          {#if matches.length == 0}
            <h4
              style="text-align:center; display: block; margin: 0 auto; color:dimgrey; font-style: italic"
            >
              No match history to display yet
            </h4>
          {/if}
          <div
            class="row"
            id="history"
            style="max-height: 150px; overflow-y: scroll; margin: 0 auto; display:block;  align-content: center; text-align: center"
          >
            {#each [...matches].reverse() as match}
              {#if match.winner.userName42 == $username42}
                <div
                  class="column"
                  style="float: left; width: 30%; display: block; margin:0 auto;"
                >
                  <p style="color: green; font-weight: 700">Won to</p>
                </div>
                <div class="column" style="float: left; width: 30%;">
                  <p>{match.loser.userName42}</p>
                </div>
                <div class="column" style="float: left; width: 30%;">
                  <p>{match.score}</p>
                </div>
              {:else}
                <div class="column" style="float: left; width: 30%;">
                  <p style="color: red; font-weight: 700">Lost to</p>
                </div>
                <div class="column" style="float: left; width: 30%;">
                  <p>{match.winner.userName42}</p>
                </div>
                <div class="column" style="float: left; width: 30%;">
                  <p>{match.score}</p>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
      <div style="width:400px; margin: 0 auto; display: block;">
        <h1 style="background-color: darkgrey; color:white; text-align:center;">
          ACHIEVEMENTS
        </h1>
        <div class="achievements">
          {#if $wins == 0 && friends.length == 0 && $ownmail == 'false'}
            <h4
              style="text-align:center; display: block; margin: 0 auto; color:dimgrey; font-style: italic"
            >
              No achievements to display yet
            </h4>
          {:else if $wins != 0}
            <p>
              <span style="text-transform: uppercase; font-weight: 600;"
                >🥇 One first win 🥇</span
              ><br /><span
                style="font-weight: 400;font-style: italic; color:grey"
                >You defeated another player on match!</span
              >
            </p>
          {/if}
          {#if friends.length > 0}
            <p>
              <span style="text-transform: uppercase; font-weight: 600;"
                >🤹‍♀️ Social guy 🤹‍♀️</span
              ><br /><span
                style="font-weight: 400;font-style: italic; color:grey"
                >You added one person as a friend!</span
              >
            </p>
          {/if}
          {#if $ownmail == 'true'}
            <p>
              <span style="text-transform: uppercase; font-weight: 600;"
                >🛡 Secure guy 🛡</span
              ><br /><span
                style="font-weight: 400;font-style: italic; color:grey"
                >You enabled two factor authentication!</span
              >
            </p>
          {/if}
        </div>
      </div>
      <div style="width:400px; margin: 0 auto; display: block;">
        <h1 style="background-color: darkgrey; color:white; text-align:center;">
          FRIENDS
        </h1>
        <div class="friends">
          {#if friends.length == 0}
            <h4
              style="text-align:center; display: block; margin: 0 auto; color:dimgrey; font-style: italic"
            >
              No friends yet to display
            </h4>
          {/if}
          {#each friends as friend}
            <div class="oneFriend">
              <a
                class="profileLink"
                href="http://localhost:8080/#/userprofile"
                on:click={() => {
                  otherUser.update((n) => friend.id);
                }}
              >
                <img
                  id="otherProfile"
                  src={friend.imageURL}
                  alt="profile"
                />{friend.userName}</a
              >
            </div>
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
    align-items: center;
    color: black;
  }
  h1 {
    font-weight: 700;
    font-size: 30px;
  }
  .profile {
    margin: 0 auto;
    margin-top: 30px;
    display: block;
    width: 200px;
    height: 200px;
    background-size: contain;
    background-position: center;
    border-radius: 50%;
    border: solid 10px gainsboro;
    display: block;
    margin: 0 auto;
  }

  .oneFriend {
    display: flex;
    margin: 0 auto;
  }

  .friends {
    display: flex;
    align-items: center;
    margin-bottom: 50px;
    text-align: center;
  }

  #otherProfile {
    width: 100px;
    border: solid 1px black;
    height: 100px;
    margin-bottom: 10px;
    border-radius: 50%;
    display: block;
  }

  .profileLink {
    text-align: center;
    margin: 0 auto;
    margin-bottom: 20px;
    display: block;
    padding: 10px;
    border-radius: 10px;
    cursor: pointer;
    background-color: transparent;
    color: black;
    border: 2px solid black;
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
    font-size: 20px;
    tab-size: 4;
  }
  .sp2 {
    font-weight: 200;
    font-size: 20px;
    tab-size: 4;
  }
  .bt1 {
    margin: 0 auto;
    align-items: center;
    min-width: 200px;
    text-align: center;
    border-radius: 5px;
    background-color: rgb(224, 62, 62);
    color: white;
    padding: 10px;
    transition: transform 0.1s;
  }
  .bt1:hover {
    transform: scale(1.05);
  }
  .bt2 {
    margin: 0 auto;
    align-items: center;
    min-width: 200px;
    text-align: center;
    border-radius: 5px;
    background-color: rgb(41, 138, 235);
    color: white;
    padding: 10px;
    transition: transform 0.1s;
  }
  .bt2:hover {
    transform: scale(1.05);
  }
  .TWOFA {
    transition: transform 0.1s;
  }
  .TWOFA:hover {
    transform: scale(1.05);
  }

  .newUserName {
    margin: 0 auto;
    display: block;
    align-items: center;
    text-align: center;
  }

  .newMail {
    margin: 0 auto;
    display: block;
    align-items: center;
    text-align: center;
  }

  #history {
    margin: 0 auto;
    display: block;
    margin-left: 70px;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    tab-size: 10;
  }

  .achievements {
    font-size: 15px;
    text-align: center;
  }
</style>
