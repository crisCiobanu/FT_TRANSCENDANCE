<script lang="ts">
  import { onMount } from 'svelte';
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
    username42,
  } from '../stores.js';

  let mail;
  let user;
  let newUserName = 'false';
  let newMail = 'false';
  let fileinput: any;
  let newImage: any;
  let friendArray = [];
  let myFriends: any;
  let friends = [];
  let newFriend;
  let matches = [];
  let mat = [];

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

  async function changeUserName() {
    username.update((n) => user);
    await fetch('http://localhost:3000/users/updateusername/', {
      method: 'POST',
      body: JSON.stringify({ username: user, id: $id }),
      headers: {
        Authorization: 'Bearer ' + $cookie,
        'Content-type': 'application/json; charset=UTF-8',
      },
    });
    alert('Your username has beem changed to ' + user);
    newUserName = 'false';
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
    image_url.update((n) => newImage.url);
  }

  onMount(async () => {
    myFriends = await fetch("http://127.0.0.1:3000/auth/currentuser", 
          {
              method: 'GET',
              credentials: 'include',
              headers: 
              {
              'Authorization': 'Bearer ' + $cookie,
              "Content-type": "application/json; charset=UTF-8"
              },
          }).then(response => myFriends = response.json());
          friendArray = myFriends.friends;
          matches = myFriends.matches;
          console.log(myFriends);
          for (let i = 0; i < friendArray.length; i++) {
            if (onlyNumbers(friendArray[i])) {
              newFriend = await fetch('http://localhost:3000/users/' + friendArray[i], {
              method: 'GET',
              credentials: 'include',
              headers: {
                Authorization: 'Bearer ' + $cookie,
                'Content-type': 'application/json; charset=UTF-8',
              },
            }).then((response) => (newFriend = response.json()));
            friends = [...friends, newFriend];
            }
          }
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
            aria-label="Enter new username"
            bind:value={user}
          />
          <div>
            <button
              on:click={changeUserName}
              type="submit"
              value="Submit"
              style="cursor: pointer">Change</button
            >
          </div>
          <div />
          <div>
            <button
              style="cursor: pointer; font-size: 50px; border: none; background-color: transparent;"
              on:click={() => {
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
            aria-label="Mail address"
            bind:value={mail}
          />
          <div>
            <button
              on:click={changeMailAddress}
              type="submit"
              value="Submit"
              style="cursor: pointer">Change</button
            >
          </div>
          <div />
          <div>
            <button
              style="cursor: pointer;font-size: 50px; border: none; background-color: transparent;"
              on:click={() => (newMail = 'false')}>🔙</button
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
          on:click={() => {
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
        on:click={() => {
          newUserName = 'true';
          newMail = 'false';
        }}>Change user name</button
      >
        {#if $TWOFA == 'false' && $ownmail == 'true'}
          <button
            on:click={TWOFAon}
            class="TWOFA"
            style="cursor: pointer; margin: 0 auto;padding: 10px;width: 200px;color: white; background-color:lightslategrey;border-radius: 5px"
            >Enable 2FA</button
          >
        {:else if $TWOFA == 'false'}
          <button
            class="TWOFA"
            on:click={() => (newMail = 'true')}
            style="cursor: pointer; margin: 0 auto;padding: 10px;width: 200px;color: white; background-color:lightslategrey;border-radius: 5px"
            >Enable 2FA</button
          >
        {:else}
          <button
            on:click={TWOFAoff}
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
        <h1>
          <span class="sp1">wins</span> <span class="sp2"> {$wins}</span><span
            class="sp1">&emsp;losses</span
          > <span class="sp2">{$losses}</span><span class="sp1"
            >&emsp;level</span
          ><span class="sp2"> {$level}</span>
        </h1>
      </div>
      <div style="width: 400px;margin: 0 auto; display: block">
        <h1 style="background-color: darkgrey; color:white; text-align:center;">
          MATCH HISTORY
        </h1>
        {#each matches as match}
        <li style='margin-left:100px;'>{match.winner == $username42 ? 'Won to ' + match.loser + ' ' + match.score : 'Lost to ' + match.winner + ' ' + match.score }</li>
        {/each}
      </div>
      <div style="width:400px; margin: 0 auto; display: block;">
        <h1 style="background-color: darkgrey; color:white; text-align:center;">
          FRIENDS
        </h1>
        <div class='friends'>
        {#each friends as friend}
        <div class=oneFriend>
        <a class="profileLink" href="#/userprofile" on:click={() => {otherUser.update(n => friend.id)}}>  <img
          class="otherProfile"
          src={friend.imageURL}
          alt="profile"
        />{friend.userName}</a>
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
    text-align: center;;
  }

  .otherProfile {
    width: 100px;
    border: solid 3px black;
    height: 100px;
    /* margin: 0 auto; */
    margin-bottom: 10px;
    /* background-size: contain;
    background-position: center; */
    border-radius: 50%;
    display: block;
  }

  .profileLink {
    text-align: center;
    margin: 0 auto;
    /* margin-top: 50px; */
    margin-bottom: 20px;
    display: block;
    /* width: 50px; */
    padding: 10px;
    border-radius: 10px;
    cursor: pointer;
    background-color: dodgerblue;
    color: white;
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
</style>
