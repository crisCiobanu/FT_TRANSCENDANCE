<script lang="ts">
  import {
    other_level,
    logged,
    other_losses,
    username,
    other_username,
    other_wins,
    image_url,
    other_image_url,
    other_firstname,
    other_lastname,
    id,
    cookie,
    TWOFA,
    ownmail,
    email,
    currentChat,
    currentProfile,
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
  export let currentRoom = rooms[rooms.length - 1];
  export let roomPassword: string = '';
  export let currentUser;
  export let creation = false;
  export let pass = '';
  export let free = '';
  export let title = '';
  export let muteOptions = 'false';
  export let muteTime = 0;
  export let Mutes = [];
  export let numberId = Number($id);
  let myChannels = [];
  let allRooms = [];
  export let newRoom = {
    name: '',
    password: '',
    isPublic: false,
  };
  export let password = 'false';

  function viewUser() {
    other_firstname.update((n) => currentUser.firstName);
    other_lastname.update((n) => currentUser.lastName);
    other_level.update((n) => currentUser.level);
    other_wins.update((n) => currentUser.wins);
    other_losses.update((n) => currentUser.losses);
    other_username.update((n) => currentUser.userName);
    other_image_url.update((n) => currentUser.imageURL);
  }

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

  async function muteUser() {
    socket.emit('muteUser', {
      channel: currentRoom.name,
      userName42: currentUser.userName42,
      minutes: muteTime,
    });
    await socket.on('muteUserResponse', (response) => {
      if (response == 'true') {
        alert(currentUser.userName + ' has been muted for 1 minute');
      } else {
        alert('User ' + currentUser.userName + ' could not be muted');
      }
    });
    muteOptions = 'false';
    muteTime = 0;
  }

  function banUser() {
    alert(currentUser.userName + ' has been banned for 1 minute');
  }

  function makeAdmin() {
    alert(
      currentUser.userName +
        ' is now an administrator of channel #' +
        currentRoom.name.toUpperCase(),
    );
  }

  function addPassword() {
    password = 'true';
    password = password;
  }

  function updateCurrentUser(user) {
    currentUser = user;
    currentProfile.update((n) => user.userName42);
  }

  function removePassword() {
    password = 'false';
    password = password;
  }

  function initAll(init) {
    console.log(init);
    rooms = init.allChannels;
    rooms = [...rooms];
    for (let i = 0; i < rooms.length; i++) {
      allRooms = [...allRooms, rooms[i].name];
    }
    privateMessages = init.directMessageChannels;
    privateMessages = [...privateMessages];
    for (let i = 0; i < rooms.length; i++) {
      for (let j = 0; j < rooms[i].users.length; j++) {
        if (rooms[i].users[j].id == $id)
          myChannels = [...myChannels, rooms[i].name];
      }
    }
    for (let k = 0; k < rooms.length; k++) {
      if (rooms[k].name == $currentChat) {
        currentRoom = rooms[k];
        messages = currentRoom.messages;
        break;
      }
    }
    for (let i = 0; i < currentRoom.bansAndMutes.length; i++) {
      if (currentRoom.bansAndMutes[i].muted == true) {
        Mutes = [...Mutes, currentRoom.bansAndMutes[i].userId];
      }
    }
    //   let stop = '0';
    //   for (let i = 0; i < rooms.length; i++ ) {
    //     if (stop == '1') {
    //       break;
    //     }
    //    for (let j = 0; j < rooms[i].users.length; j++) {
    //     console.log(rooms[i].users[j].userName42);
    //     if (rooms[i].users[j].userName42 == $currentProfile) {
    //       currentUser = rooms[i].users[j];
    //       currentProfile.update(n => currentUser.userName42);
    //       stop = '1';
    //     }
    //   }
    // }
    console.log(myChannels);
  }

  function createChannel(channel) {
    console.log('A');
    console.log(channel);
    rooms = channel.allChannels;
    rooms = [...rooms];
    // myRooms = channel.userChannels;
    // myRooms = [...myRooms];
    privateMessages = channel.directMessageChannels;
    privateMessages = [...privateMessages];
    // currentRoom = myRooms[myRooms.length - 1];
  }

  function deleteRoom(room) {
    alert(`Room ${room.name} has been deleted`);
    socket.emit('deleteRoom', { name: room.name });
    rooms = rooms.filter((t) => t != room);
    myChannels = myChannels.filter((t) => t != room.name);
    currentRoom = '';
  }

  function leaveRoom(room) {
    alert('✈️ ✈️ ✈️ You left room #' + room.name.toUpperCase());
    socket.emit('leaveRoom', { name: room.name });
    myChannels = myChannels.filter((t) => t != room.name);
    currentRoom = '';
  }

  async function joinRoom() {
    console.log(myChannels);
    socket.emit('joinRoom', { name: currentRoom.name, password: roomPassword });
    await socket.on('joinRoomResponse', (response) => {
      if (response == 'true') {
        console.log(response);
        alert(
          '😎 😎 😎 You successfully joined Room #' +
            currentRoom.name.toUpperCase(),
        );
        myChannels = [...myChannels, currentRoom.name];
        currentRoom = currentRoom;
        $currentChat = currentRoom.name;
      }
      if (response == 'false') {
        alert('❌ ❌ ❌ Wrong passsword');
      }
    });
    roomPassword = '';
  }

  async function changeConv(title) {
    currentRoom = title;
    $currentChat = title.name;
  }

  function sendMessage() {
    if (validateInput()) {
      // console.log(currentRoom);
      // console.log(Otext);
      console.log(Mutes);
      let numberId = Number($id);
      for (let i = 0; i < Mutes.length; i++) {
        if (numberId == Mutes[i]) {
          Otext = '';
          return;
        }
      }
      socket.emit('message', { channel: currentRoom, text: Otext });
      Otext = '';
    }
  }

  function receivedMessage(message) {
    messages = [...messages, message];
  }

  function validateInput() {
    return Oname.length > 0 && Otext.length > 0;
  }

  function updateChannels(update) {
    let allUpdate = [];
    for (let k = 0; k < update.length; k++) {
      allUpdate = [...allUpdate, update[k].name];
    }

    if (rooms.length > update.length) {
      let missingRoom = allRooms.filter((x) => allUpdate.indexOf(x) === -1);
      if (currentRoom && currentRoom.name == missingRoom) {
        alert(
          `⚠️ ⚠️ ⚠️ Chat room ${missingRoom} has been deleted by its owner`,
        );
      }
      allUpdate.length = 0;
      currentRoom = '';
      currentChat.update((n) => '');
    }
    // if (allUpdate )
    rooms = update;
    rooms = [...rooms];
    for (let i = 0; i < rooms.length; i++) {
      for (let j = 0; j < rooms[i].users.length; j++) {
        if (rooms[i].users[j].id == $id)
          myChannels = [...myChannels, rooms[i].name];
      }
    }
    for (let k = 0; k < rooms.length; k++) {
      if (rooms[k].name == $currentChat) {
        currentRoom = rooms[k];
        messages = currentRoom.messages;
        break;
      }
      for (let i = 0; i < currentRoom.bansAndMutes.length; i++) {
        if (currentRoom.bansAndMutes[i].muted == true) {
          Mutes = [...Mutes, currentRoom.bansAndMutes[i].userId];
        }
      }

      //   let stop = 0;
      //   for (let i = 0; i < rooms.length; i++ ) {
      //     if (stop == 1) {
      //       break;
      //     }
      //    for (let j = 0; j < rooms[i].users.length; j++) {
      //     if (rooms[i].users[j].userName42 == $currentProfile) {
      //       currentUser = rooms[i].users[j];
      //       currentProfile.update(n => currentUser.userName42);
      //       stop = 1;
      //     }
      //   }
      // }
      console.log(myChannels);
      currentRoom = currentRoom;
    }
  }

  onMount(async () => {
    socket = io('http://localhost:3000', {
      auth: { token: $cookie },
    });

    socket.on('updateChannels', (update) => {
      console.log('update');
      updateChannels(update);
    });

    //   socket.on('userChannels', (userChannels) => {
    //     updateChannels(userChannels);
    //   });

    socket.on('init', (init) => {
      console.log('init');
      initAll(init);
    });

    //   socket.on('addToDirectMessageRooms', (room) => {
    //     updatePrivateMessages(room);
    //   });

    //   socket.on('addToMyRooms', (room) => {
    //     console.log('addToMyRoom');
    //     updateMyRooms(room);
    //   });

    //   socket.on('addToAllRooms', (room) => {
    //     console.log('addToAllRooms');
    //     console.log(room);
    //     updateAllRooms(room);
    //   });

    socket.on('alert', (alert) => {
      alert(alert);
    });

    socket.on('createChannel', (channel) => {
      console.log('createChannel');
      createChannel(channel);
    });

    socket.on('msgToClient', (message) => {
      receivedMessage(message);
    });

    //   socket.on('joinedRoom', (message) => {
    //     console.log('joinedRoom');
    //     joinedRoom(message);
    //   });
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
        <h3 id="roomTitle">#{currentRoom.name.toUpperCase()}</h3>
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
          {#each rooms as room}
            {#if room.channelOwnerId == $id}
              <button id="selectMyOwnRoom" on:click={() => changeConv(room)}
                >#{room.name.toUpperCase()}</button
              ><br />

              {#if room == currentRoom}
                <div>
                  {#each room.users as user}
                    <button
                      on:click={() => {
                        updateCurrentUser(user);
                      }}
                      id="selectUser">{user.userName}</button
                    ><br />
                  {/each}
                </div>
              {/if}
            {:else if myChannels.indexOf(room.name) != -1}
              <button id="selectMyRoom" on:click={() => changeConv(room)}
                >#{room.name.toUpperCase()}</button
              ><br />
              {#if room == currentRoom}
                <div>
                  {#each room.users as user}
                    <button
                      on:click={() => (currentUser = user)}
                      id="selectUser">{user.userName}</button
                    ><br />
                  {/each}
                </div>
              {/if}
            {:else}
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
            <div>
              <!-- {#if currentRoom.muted.indexOf($id) != -1} -->
              <p style="text-align: center; color:red">
                You are muted on this channel
              </p>
              <!-- {/if} -->
            </div>
            {#if myChannels.indexOf(currentRoom.name) == -1 && currentRoom.isPublic == true}
              <button on:click={() => joinRoom()}>Join room</button>
            {:else if currentRoom.isPublic == false && myChannels.indexOf(currentRoom.name) == -1}
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
                  <p class="selfmsg">
                    <img
                      alt="profile"
                      class="profile"
                      src={$image_url}
                    />{msg.text}
                  </p>
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
          {#if currentRoom && currentRoom.channelOwnerId == $id}
            <button id="leaveRoom" on:click={() => deleteRoom(currentRoom)}
              >Delete Room</button
            >
          {:else if currentRoom && myChannels.indexOf(currentRoom.name) != -1}
            <button id="leaveRoom" on:click={() => leaveRoom(currentRoom)}
              >Leave Room</button
            >
          {/if}
        </div>
      </div>

      <!--Profile-->
      <div class="column3">
        {#if currentUser}
          {#if currentUser.id == $id}
            <img class="profile" src={$image_url} alt="profile" />
            <p>{currentUser.userName}</p>
            <a href="#/profile" class="profileLink">View My Profile</a>
          {:else}
            <img class="profile" src={currentUser.imageURL} alt="profile" />
            <p>{currentUser.userName}</p>
            <a href="#/userprofile" on:click={viewUser} class="profileLink"
              >View profile</a
            >
            <button class="profileButton">Add as friend</button>
            <button class="profileButton">Block user</button>
            {#if currentRoom.channelOwnerId == $id || currentRoom.channelAdminsId.indexOf($id) != -1}
              <h4>Admin</h4>

              <!-- {#if currentRoom.muted.indexOf($id) != -1} -->
                <button style="color: white; background: red;">Muted</button>
              <!-- {:else} -->
                <button
                  on:click={() => (muteOptions = 'true')}
                  class="profileButton">Mute</button
                >
              <!-- {/if} -->
              {#if muteOptions == 'true'}
                <div>
                  <label>
                    <input type="radio" bind:group={muteTime} value="5" />
                    5 min.
                  </label>

                  <label>
                    <input type="radio" bind:group={muteTime} value="1440" />
                    1 day
                  </label>

                  <label>
                    <input type="radio" bind:group={muteTime} value="4320" />
                    3 days
                  </label>
                  <!-- {#if currentRoom.} -->
                  <button on:click={muteUser}>Mute User</button>
                </div>
              {/if}
              <button on:click={banUser} class="profileButton">Ban</button>
            {:else if currentRoom.channelOwnerId == $id}
              <button on:click={makeAdmin} class="profileButton"
                >Upgrade status</button
              >
            {/if}
          {/if}
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
    max-width: 800px;
    height: 1000px;
    display: block;
    align-items: center;
    align-content: center;
    text-align: center;
    margin-top: 30px;
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
  }

  .column1 {
    display: flex;
    vertical-align: text-bottom;
    flex-direction: column;
    flex: 1.5;
    border-right: lightgray;
    border: 2px black;
    background-color: lightgrey;
    height: 100%;
    overflow-y: scroll;
  }

  .rooms {
    text-align: left;
    padding-left: 5px;
  }

  .column2 {
    display: block;
    flex-basis: 100%;
    flex: 5;
    padding-left: 10px;
    background-color: ghostwhite;
  }

  .column3 {
    display: flex;
    vertical-align: text-bottom;
    flex-direction: column;
    flex: 1.5;
    border-right: lightgray;
    border: 2px black;
    background-color: whitesmoke;
    height: 100%;
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

  .profile {
    width: 100px;
    border: solid 3px black;
    height: 100px;
    margin: 0 auto;
    margin-top: 15px;
    background-size: contain;
    background-position: center;
    border-radius: 50%;
  }

  .profileLink {
    border: 0;
    background-color: gainsboro;
    margin: 5px 10px;
    font-size: 14px;
    padding: 5px;
  }
</style>
