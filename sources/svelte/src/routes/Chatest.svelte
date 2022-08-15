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
  import { init, xlink_attr } from 'svelte/internal';

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
  export let banOptions = 'false';
  export let banTime = 0;
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
    let time = muteTime;
    socket.emit('muteUser', {
      channel: currentRoom.name,
      userName42: currentUser.userName42,
      minutes: muteTime,
    });
    await socket.on('muteUserResponse', (response) => {
      if (response == 'true') {
        alert(currentUser.userName + 'has been muted for ' + time + ' minutes');
      } else if (response == 'muted') {
        alert(
          currentUser.userName + `has already been muted for a longer period`,
        );
      } else {
        alert('User ' + currentUser.userName + ' could not be muted');
      }
    });
    muteOptions = 'false';
    muteTime = 0;
  }

  async function banUser() {
    let time = banTime;
    socket.emit('banUser', {
      channel: currentRoom.name,
      userName42: currentUser.userName42,
      minutes: banTime,
    });
    await socket.on('banUserResponse', (response) => {
      if (response == 'true') {
        alert(
          currentUser.userName +
            ' has been banned for ' +
            time +
            ' minutes 👹 👹 👹',
        );
      } else if (response == 'banned') {
        alert(
          currentUser.name +
            ' has already been banned by another administrator',
        );
      } else {
        alert('User ' + currentUser.userName + ' could not be banned');
      }
    });
    banOptions = 'false';
    banTime = 0;
  }

  async function makeAdmin() {
    socket.emit('makeAdmin', {
      channel: currentRoom,
      userName42: currentUser.userName42,
    });
    await socket.on('makeAdminResponse', (response) => {
      if (response == 'false') {
        alert('😱 😱 😱 Operation failed');
      } else if (response == 'alreadyAdmin') {
        alert(
          currentUser.userName + ' is already an administrator on this channel',
        );
      } else if (response == 'true') {
        alert(
          currentUser.userName +
            ' is now an administrator of channel #' +
            currentRoom.name.toUpperCase(),
        );
      }
    });
  }

  async function removeAdmin() {
    socket.emit('removeAdmin', {
      channel: currentRoom,
      userName42: currentUser.userName42,
    });
    await socket.on('removeAdminResponse', (response) => {
      if (response == 'notAdmin') {
        alert(
          currentUser.userName +
            ' is not an administrator on channel #' +
            currentRoom.name,
        );
      }
      if (response == 'true') {
        alert(
          currentUser.userName +
            ' is no longer an administrator of channel #' +
            currentRoom.name.toUpperCase(),
        );
      }
    });
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
    for (let k = 0; k < privateMessages.length; k++) {
      if (privateMessages[k].name == $currentChat) {
        currentRoom = privateMessages[k];
        for (let i = 0; i < currentRoom.users.length; i++) {
      if (currentRoom.users[i].id != $id) {
        currentUser = currentRoom.users[i];
      } 
    }
        messages = currentRoom.messages;
        break;
      }
    }
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

  function deletePrivateMessage(room) {
    alert('Conversation has been deleted');
    socket.emit('deletePrivateMessage', { name: room.name });
    privateMessages = privateMessages.filter((t) => t != room);
    currentRoom = '';
    currentUser = '';
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
      if (response == 'ban') {
        alert('🤬 🤬 🤬 You have been banned from this room');
      }
    });
    roomPassword = '';
  }

  function changeConv(title) {
    currentRoom = title;
    currentChat.update((n) => title.name);
    currentUser = '';
    currentProfile.update((n) => '');
    messages = currentRoom.messages;
  }

  function changeConvMessages(title) {
    currentRoom = title;
    currentChat.update((n) => title.name);
    for (let i = 0; i < currentRoom.users.length; i++) {
      if (currentRoom.users[i].id != $id) {
        currentUser = currentRoom.users[i];
      } 
    }
    messages = currentRoom.messages;
  }

  function sendMessage() {
    if (validateInput()) {
      socket.emit('message', { channel: currentRoom, text: Otext });
      socket.on('messageResponse', (message) => {
        if (message == 'muted') {
          Mutes = [...Mutes, currentRoom.name];
        }
        if (message == 'unmuted') {
          Mutes = Mutes.filter((t) => t != currentRoom.name);
        }
      });
      Otext = '';
    }
  }

  function receivedMessage(message) {
    console.log('ca passe');
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
    console.log(update);
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
    }
    for (let k = 0; k < privateMessages.length; k++) {
      if (privateMessages[k].name == $currentChat) {
        currentRoom = privateMessages[k];
        messages = currentRoom.messages;
        break;
      }
    }
    currentRoom = currentRoom;
  }

  function createPrivateMessage() {
    socket.emit('createPrivateMessage', currentUser.userName42
    );
    socket.on('createPrivateMessageResponse', (newPM) => {
      if (newPM == 'true') {

      }
      if (newPM == 'exist') {
        let DMname = $username + '-' + currentUser.userName;
        for (let i = 0; i < privateMessages.length; i++) {
          if (DMname == privateMessages[i].name) {
            currentRoom = privateMessages[i];
          }
        }
      }


    })
  }

  onMount(async () => {
    socket = io('http://localhost:3000', {
      auth: { token: $cookie },
    });

    socket.on('updateChannels', (update) => {
      console.log('update');
      updateChannels(update);
    });

    socket.on('init', (init) => {
      console.log('init');
      initAll(init);
    });

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

    socket.on('youHaveBeenBanned', (message) => {
      alert('You have been banned from channel ' + message);
      currentRoom = '';
      currentUser = '';
      currentProfile.update((n) => '');
      currentChat.update((n) => '');
      myChannels = myChannels.filter((t) => t != message);
    });

    socket.on('youAreNowAdmin', (message) => {
      alert('You are now an administator on channel #' + message);
    });

    socket.on('youAreNoMoreAdmin', (message) => {
      alert('You are no longer an administator on channel #' + message);
    });

    socket.on('updatePrivateMessages', (message) => {
      privateMessages = message;
      if (privateMessages[privateMessages.length - 1].channelOwnerId == $id) {
        currentRoom = privateMessages[privateMessages.length - 1];
      messages = currentRoom.messages;
      }

    })
  });
</script>

<main>
  {#if creation == true}
    <!--CREATION FORM-->
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
    <!-- CHAT INTERFACE -->
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
      <!--CHANNELS-->
      <div class="column1">
        <h4 class="sectionTitle">Rooms</h4>
        <!--Rooms-->
        <div class="rooms">
          {#each rooms as room}
            {#if room.channelOwnerId == $id && room == currentRoom}
              <button
                style="text-decoration: underline double"
                id="selectMyOwnRoom"
                on:click={() => changeConv(room)}
                >#{room.name.toUpperCase()}</button
              ><br />
            {:else if room.channelOwnerId == $id}
              <button id="selectMyOwnRoom" on:click={() => changeConv(room)}
                >#{room.name.toUpperCase()}</button
              ><br />
            {:else if myChannels.indexOf(room.name) != -1 && room == currentRoom}
              <button
                style="text-decoration: underline double"
                id="selectMyRoom"
                on:click={() => changeConv(room)}
                >#{room.name.toUpperCase()}</button
              ><br />
            {:else if myChannels.indexOf(room.name) != -1}
              <button id="selectMyRoom" on:click={() => changeConv(room)}
                >#{room.name.toUpperCase()}</button
              ><br />
            {:else}
              <button id="selectRoom" on:click={() => changeConv(room)}
                >#{room.name.toUpperCase()}</button
              ><br />
            {/if}
          {/each}
        </div>
        <!--Private Messages-->
        <div>
          <h4 class="sectionTitle">Messages</h4>
          {#each privateMessages as privateMessage}
            <button
              id="selectPrivMsg"
              on:click={() => changeConvMessages(privateMessage)}
            >
              {privateMessage.name}
            </button><br />
          {/each}
        </div>
      </div>

      <!--MESSAGES-->
      <div id="chat" class="column2">
        <div id="messages">
          {#if currentRoom}
            <div>
              {#if Mutes && Mutes.indexOf(currentRoom.name) != -1}
                <p style="text-align: center; color:red">
                  You are muted on this channel
                </p>
              {/if}
            </div>
            {#if myChannels.indexOf(currentRoom.name) == -1 && currentRoom.isPublic == true && currentRoom.isDirectMessage != true}
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
                    <i>you</i>: {msg.text}
                  </p>
                {:else}
                  <p class="othermsg">
                    <b>{msg.user.userName}</b>: {msg.text}
                  </p>
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
          {#if currentRoom && currentRoom.isDirectMessage == true}
          <button id="leaveRoom" on:click={() => deletePrivateMessage(currentRoom)}
            >Delete Private Conversation</button
          >
          {:else if currentRoom && currentRoom.channelOwnerId == $id}
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

      <!--PROFILE-->
      <div class="column3">
        {#if currentRoom && myChannels.indexOf(currentRoom.name) != -1 && !currentUser}
          <div style="margin-top: 15px;">
            {#each currentRoom.users as user}
              <button
                on:click={() => {
                  updateCurrentUser(user);
                }}
                id="selectUser"
              >
                <img class="listAvatar" src={user.imageURL} alt="profilePic" />
                {user.userName}</button
              >
            {/each}
          </div>
        {/if}
        {#if currentUser}
        {#if currentRoom.isDirectMessage == false}
          <button
            style="display: block; text-align: right; border: none; margin-bottom: -10px; color: black"
            on:click={() => {
              currentUser = '';
              currentProfile.update((n) => '');
            }}>X</button
          >
          {/if}
          {#if currentUser.id == $id}
            <a href="#/profile" class="profileLink"
              ><img
                class="profile"
                src={$image_url}
                alt="profile"
              />{currentUser.userName}</a
            >
          {:else if currentRoom.isDirectMessage == true}
          <a href="#/profile" class="profileLink"
          ><img
            class="profile"
            src={currentUser.imageURL}
            alt="profile"
          />{currentUser.userName}</a
        >
          {:else}
            <a href="#/userprofile" on:click={viewUser} class="profileLink">
              <img
                class="profile"
                src={currentUser.imageURL}
                alt="profile"
              />{currentUser.userName}</a
            >
            <!-- <button class="profileButton">Add as friend</button>
            <button class="profileButton">Block user</button> -->
            <button on:click={createPrivateMessage} class="profileButton"
              >Send PM</button
            >
            {#if currentRoom && (currentRoom.channelOwnerId == $id || currentRoom.channelAdminsId.indexOf($id) != -1)}
              <h4>Admin</h4>

              {#if Mutes.indexOf(currentRoom.name) != -1}
                <button style="color: white; background: red;">Muted</button>
              {:else if currentRoom.channelOwnerId != currentUser.id}
                <button
                  on:click={() => {
                    muteOptions = 'true';
                    banOptions = 'false';
                  }}
                  class="profileButton">Mute</button
                >
              {/if}
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

              <button
                on:click={() => (banOptions = 'true')}
                class="profileButton">Ban</button
              >

              {#if banOptions == 'true'}
                <div>
                  <label>
                    <input type="radio" bind:group={banTime} value="5" />
                    5 min.
                  </label>

                  <label>
                    <input type="radio" bind:group={banTime} value="1440" />
                    1 day
                  </label>

                  <label>
                    <input type="radio" bind:group={banTime} value="4320" />
                    3 days
                  </label>
                  <!-- {#if currentRoom.} -->
                  <button on:click={banUser}>Ban User</button>
                </div>
              {/if}
            {/if}
            {#if currentRoom.channelOwnerId == $id && currentRoom.channelAdminsId.indexOf(currentUser.id.toString()) == -1}
              <button on:click={makeAdmin} class="profileButton"
                >Upgrade status</button
              >
            {:else if currentRoom.channelOwnerId == $id && currentRoom.channelAdminsId.indexOf(currentUser.id.toString()) != -1}
              <button on:click={removeAdmin} class="profileButton"
                >Downgrade status</button
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
    height: 2200px;
    display: block;
    align-items: center;
    align-content: center;
    text-align: center;
    margin-top: 30px;
    /* overflow: hidden; */
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
    height: 400px;
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
    /* height: 100%; */
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
    /* height: 100%; */
  }

  .sectionTitle {
    background-color: rgb(240, 240, 240);
    color: slategrey;
    padding: 5px 15px 5px;
  }

  #selectUser {
    font-size: 16px;
    margin-left: 20px;
    /* margin-top: 0px; */

    font-weight: 400;
    line-height: 0.5;
    color: darkblue;
    background-color: transparent;
    border: none;
    display: block;
    text-align: left;
    /* align-items: center;
    align-content: center;
    align-self: center; */
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
    background-color: transparent;
    margin: 5px 10px;
    font-size: 14px;
    padding: 5px;
  }

  .listAvatar {
    width: 25px;
    height: 25px;
    margin: 0 auto;
    /* margin-top: 15px; */
    margin-right: 10px;
    align-self: center;
    background-size: contain;
    background-position: center;
    border-radius: 50%;
  }
</style>
