<script lang="ts">
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
    cookie,
    TWOFA,
    ownmail,
    email,
  } from '../stores.js';

  import { onMount } from 'svelte';
  import io from 'socket.io-client';
  import { init } from 'svelte/internal';
  export let Oname = $username;
  export let Otext = '';
  export let messages = [];
  export let privateMessages = [];
  export let socket = null;
  export let rooms = [];
  export let currentRoom;
  export let roomPassword: string = '';
  export let myRooms = [];
  export let currentUser;
  export let creation = false;
  export let pass = '';
  export let free = '';
  export let title = '';
  export let newRoom = {
    name: '',
    password: '',
    isPublic: false,
  };
  export let password = 'false';

  async function createRoom() {
    if (!title || !free) {
      console.log('1');
      alert('❌ Missing information !');
    } else if (free != 'true' && !pass) {
      console.log('2');
      alert('❌ Missing information !');
    } else {
      newRoom.name = title;
      newRoom.password = pass;
      if (free == 'true') {
        newRoom.isPublic = true;
      } else {
        newRoom.isPublic = false;
      }
      socket.emit('createRoom', newRoom);
      alert(`✅ Chatroom ${title} has been created`);
      creation = false;
      pass = '';
      title = '';
      free = '';
    }
  }

  function muteUser() {
    alert(currentUser.userName + ' has been muted for 1 minute');
  }

  function banUser() {
    alert(currentUser.userName + ' has been banned for 1 minute');
  }

  function makeAdmin() {
    alert(currentUser.userName + ' is now an administrator of channel #' + currentRoom.name.toUpperCase());
  }

  function addPassword() {
    password = 'true';
    password = password;
  }

  function removePassword() {
    password = 'false';
    password = password;
  }

  function initAll(init) {
    console.log('A');
    console.log(init);
    rooms = init.allChannels;
    rooms = [...rooms];
    myRooms = init.userChannels;
    myRooms = [...myRooms];
    privateMessages = init.directMessageChannels;
    privateMessages = [...privateMessages];
  }

  function createChannel(channel) {
    console.log('A');
    console.log(channel);
    rooms = channel.allChannels;
    rooms = [...rooms];
    myRooms = channel.userChannels;
    myRooms = [...myRooms];
    privateMessages = channel.directMessageChannels;
    privateMessages = [...privateMessages];
    currentRoom = myRooms[myRooms.length - 1];
  }

  function updateChannels(channels) {
    rooms = channels.allChannels;
    myRooms = channels.userChannels;
    privateMessages = channels.directMessageChannels;
  }

  function userOptions() {}

  function leaveRoom(room) {
    alert('You left room ' + room.name);
    myRooms = myRooms.filter((t) => t != room);
    currentRoom = '';
  }

  function joinRoom() {
    console.log('joinRoom');
    socket.emit('joinRoom', { name: currentRoom.name, password: roomPassword });
    roomPassword = '';
  }

  function joinedRoom(message) {
    // if (message.logged == true) {
    //   alert('✅ You successfully joined room ' + currentRoom.name);
    rooms = message.allChannels;
    rooms = [...rooms];
    myRooms = message.userChannels;
    myRooms = [...myRooms];
    console.log(myRooms);
    privateMessages = message.directMessageChannels;
    privateMessages = [...privateMessages];
    currentRoom = myRooms[myRooms.length - 1];
    // } else {
    //   alert('❌ Wrong password');
    // }
  }

  async function changeConv(title) {
    console.log(myRooms);
    currentRoom = title;
    //  messages = currentRoom.messages
  }

  async function sendRoomPassword(room) {
    myRooms = [...myRooms, room];
    alert('You successfully jointed room ' + room.name);
    console.log(myRooms);
    console.log(currentRoom);
  }

  function sendMessage() {
    if (validateInput()) {
      socket.emit('message', { channel: currentRoom, text: Otext });
      Otext = '';
    }
  }

  function receivedMessage(message) {
    messages = [...messages, message];
    console.log(messages);
  }

  function validateInput() {
    return Oname.length > 0 && Otext.length > 0;
  }

  onMount(async () => {
    socket = io('http://localhost:3000', {
      auth: { token: $cookie },
    });

    socket.on('userChannels', (userChannels) => {
      updateChannels(userChannels);
    });

    socket.on('init', (init) => {
      console.log('init');
      initAll(init);
    });

    socket.on('createChannel', (channel) => {
      console.log('createChannel');
      createChannel(channel);
    });

    socket.on('msgToClient', (message) => {
      console.log('msgToClient');
      receivedMessage(message);
    });
    socket.on('joinedRoom', (message) => {
      console.log('joinedRoom');
      joinedRoom(message);
    });
  });

</script>

<main>
  <!--Creation Form-->
  {#if creation == true}
    <div id="creation"> 
      <h2>New Chat Room</h2>
      <div>
        <input bind:value={title} placeholder="Chat room's name" />
      </div>
      <br />
      <div>
        <label>
          <input
            on:click={removePassword}
            type="radio"
            bind:group={free}
            value="true"
          />
          Public
        </label>

        <label>
          <input
            on:click={addPassword}
            type="radio"
            bind:group={free}
            value="false"
          />
          Private
        </label>
      </div>
      <br />
      <div>
        {#if password == 'true'}
          <input bind:value={pass} placeholder="Enter channel password..." />
        {/if}
        <div>
          <button class="create" on:click={createRoom}>Create new room</button>
        </div>
        <button
          style="border: none; background-color: transparent; font-size: 36px;"
          on:click={() => (creation = false)}>🔙</button
        >
      </div>
    </div>

  {:else}
     <!-- Chat interface -->
    <div class="header">
      <h1 style="text-align:center" class="text-center">Pong Chat</h1>
      {#if currentRoom}
        <h3 id="roomTitle">{currentRoom.name.toUpperCase()}</h3>
      {:else}
        <h3 style="font-style: italic;" id="roomTitle">
          Please select a room to start chatting
        </h3>
      {/if}
    </div>
    <div class="row">
      <!--Channels-->
      <div class="column1">
        <h4 class="sectionTitle">Rooms</h4>
        <div class="rooms">
          {#each myRooms as myRoom}
            {#if myRoom.channelOwnerId == $id}
              <button on:click={() => changeConv(myRoom)} id="selectMyOwnRoom"
                >#{myRoom.name.toUpperCase()}</button
              >
            {:else}
              <button on:click={() => changeConv(myRoom)} id="selectMyRoom"
                >#{myRoom.name.toUpperCase()}</button
              >
            {/if}
            <br />
            {#if myRoom == currentRoom}
              <div>
                {#each myRoom.users as user}
                  <!-- {#if user.userName != $username} -->
                    <button
                      on:click={() => (currentUser = user)}
                      id="selectUser">{user.userName}</button
                    ><br />
                  <!-- {:else}
                    <p>{user.userName}</p>
                  {/if} -->
                {/each}
              </div>
            {/if}
          {/each}

          {#each rooms as room}
            {#if myRooms.indexOf(room)}
              <button id="selectRoom" on:click={() => changeConv(room)}
                >#{room.name.toUpperCase()}</button
              ><br />
            {/if}
          {/each}
        </div>
        <div>
          <h4 class="sectionTitle">Messages</h4>
          {#each privateMessages as privateMessage}
            <button
              id="selectPrivMsg"
              on:click={() => changeConv(privateMessage)}
            >
              {privateMessage}
            </button><br />
          {/each}
        </div>
      </div>

      <!--Messages-->
      <div id="chat" class="column2">
        <div id="messages">
          {#if currentRoom}
            {#if myRooms.indexOf(currentRoom) == -1 && currentRoom.isPublic == true}
              <button on:click={() => joinRoom()}>Join room</button>
            {:else if currentRoom.isPublic == false && myRooms.indexOf(currentRoom) == -1}
              <h3>This room is password protected</h3>
              <form on:submit|preventDefault={joinRoom}>
                <input
                  style="width: 100%"
                  class="form-control"
                  bind:value={roomPassword}
                  placeholder="Enter room password..."
                />
              </form>
            {:else}
              {#each messages as msg}
                {#if msg.user.userName == $username}
                  <li class="selfmsg">{msg.text}</li>
                {:else}
                  <li class="othermsg">{msg.user.userName}: {msg.text}</li>
                {/if}
              {/each}
            {/if}
          {/if}
        </div>
        <div class="my-buttons">
          <form class="form-control" on:submit|preventDefault={sendMessage}>
            <input bind:value={Otext} placeholder="Enter message..." />
          </form>
          <button class="sendButton" on:click={sendMessage}>⏎</button>
        </div>
        <div class="my-buttons">
          <button id="createRoom" on:click={() => (creation = true)}
            >Create new room</button
          >
          {#if currentRoom}
            <button id="leaveRoom" on:click={() => leaveRoom(currentRoom)}
              >Leave Room</button
            >
          {/if}
        </div>
      </div>

      <!--Profile-->
      <div class="column3">
        {#if currentUser}
          <p>{currentUser.userName}</p>
          <button class='profileButton'>View profile</button>
          <button class='profileButton'>Add as friend</button>
          <!-- {#if currentRoom.channelOwnerId.indexOf($id) != -1} -->
            <h4>Admin</h4>
            <button on:click={muteUser} class='profileButton'>Mute</button>
            <button on:click={banUser} class='profileButton'>Ban</button>
            <button on:click={makeAdmin} class='profileButton'>Upgrade status</button>
          <!-- {/if} -->
        {/if}
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
      sans-serif;
    margin: 0 auto;
    align-items: center;
    max-width: 700px;
    margin: 0 auto;
    display: block;
    align-items: center;
    align-content: center;
    text-align: center;
    display: block;
    margin: 0 auto;
    margin-top: 30px;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
      sans-serif;
    overflow: hidden;
  }

  #roomTitle {
    font-size: 16px;
    font-weight: 600;
    background-color: slategrey;
    color: white;
    padding: 5px;
    text-align: center;
    margin-bottom: 0px;
  }

  #messages {
    height: 300px;
    overflow-y: scroll;
    margin: 0 auto;
    align-items: center;
    max-width: 600px;
    margin: 0 auto;
    background-color: ghostwhite;
    display: flex;
    flex-flow: column wrap;
    padding-top: 10px;
  }

  #chat {
    margin-top: 2rem;
    margin: 0 auto;
    align-items: center;
    display: block;
  }

  .selfmsg {
    background-color: lightblue;
    background-position: right bottom;
    color: black;
    border-radius: 5px;
    text-align: right;
    padding: 10px;
    max-width: 50%;
    margin-top: -7px;
    align-self: flex-end;
  }
  .othermsg {
    background-color: rgb(173, 230, 175);
    color: black;
    border-radius: 5px;
    margin-top: -7px;
    text-align: left;
    padding: 10px;
    max-width: 50%;
    align-self: flex-start;
  }

  .row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    height: 400px;
    /* overflow: scroll; */
  }

  .column1 {
    display: flex;
    vertical-align: text-bottom;
    flex-direction: column;
    /* flex-basis: 100%; */
    flex: 1.5;
    border-right: lightgray;
    border: 2px black;
    background-color: lightgrey;
    height: 100%;
    overflow-y: scroll;
  }

  .rooms {
    /* overflow-y: scroll; */
    text-align: left;
    padding-left: 5px;
  }

  .column2 {
    display: block;
    /* flex-direction: column; */
    flex-basis: 100%;
    flex: 5;
    padding-left: 10px;
    background-color: ghostwhite;
    /* overflow: scroll; */
  }

  .column3 {
    display: flex;
    vertical-align: text-bottom;
    flex-direction: column;
    /* flex-basis: 100%; */
    flex: 1.5;
    border-right: lightgray;
    border: 2px black;
    background-color: whitesmoke;
    height: 100%;
    /* overflow: scroll; */
  }

  .sectionTitle {
    background-color: rgb(240, 240, 240);
    color: slategrey;
    padding: 5px 15px 5px;
  }

  #selectUser {
    color: dimgrey;
    line-height: 1;
    margin-top: 0px;
    margin-left: 20px;
  }

  #selectMyRoom {
    font-size: 12px;
    margin-left: 10px;
    font-weight: 600;
    color: green;
    background-color: lightgrey;
    border: none;
    text-align: left;
  }

  #selectMyOwnRoom {
    font-size: 12px;
    margin-left: 10px;
    font-weight: 600;
    color: blue;
    background-color: lightgrey;
    border: none;
    text-align: left;
  }

  #selectRoom {
    font-size: 12px;
    margin-left: 10px;
    font-weight: 600;
    background-color: lightgrey;
    border: none;
    text-align: left;
  }

  #selectPrivMsg {
    font-size: 12px;
    margin-left: 10px;
    font-weight: 600;
    background-color: lightgrey;
    border: none;
    text-align: left;
  }

  .my-buttons {
    display: flex;
    flex-direction: row;
    /* width: 100% */
    /* flex-wrap: wrap; */
    /* align-items: right; */
    margin-right: 10px;
  }

  .form-control {
    flex-direction: column;
    cursor: pointer;
    flex: 9;
    display: flex;
    padding: 5px 5px;
    border-radius: 0;
    text-align: center;
    align-self: flex-start;
  }

  .sendButton {
    flex-direction: column;
    flex: 1;
    border-radius: 0;
    display: flex;
    background-color: darkblue;
    border: none;
    color: white;
    text-align: center;
    align-self: flex-end;
    align-self: center;
  }

  #createRoom {
    cursor: pointer;
    flex: 1 0 40%;
    margin: 0 auto;
    padding: 5px 5px;
    border-radius: 0;
    text-align: center;
    color: white;
    background-color: lightslategrey;
  }

  #leaveRoom {
    cursor: pointer;
    flex: 1 0 50%;
    margin: 0 auto;
    border-radius: 0;
    background-color: darkred;
    border: none;
    color: white;
  }

  .create {
    padding: 10px;
    background-color: darkred;
    color: white;
  }

  .profileButton {
    border: 0;
    background-color: gainsboro;
    margin: 5px 10px;
    font-size: 14px;
  }
</style>
