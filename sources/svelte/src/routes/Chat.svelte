<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import io from 'socket.io-client';

  import {
    invitedPlayer,
    username,
    otherUser,
    image_url,
    id,
    cookie,
    currentChat,
    currentProfile,
    invitation,
    logged,
  } from '../stores.js';

  import { FRONTEND_URL, BACKEND_URL} from '../domain.js'

  let Oname: string = $username;
  let Otext: string = '';
  let messages = [];
  let privateMessages = [];
  let socket = null;
  let rooms = [];
  let currentRoom = rooms[rooms.length - 1];
  let roomPassword: string = '';
  let currentUser: any;
  let creation = false;
  let pass: string = '';
  let free: string = '';
  let title: string = '';
  let muteOptions = 'false';
  let muteTime = 0;
  let banOptions = 'false';
  let banTime: number = 0;
  let Mutes = [];
  let changeRemove = 'false';
  let newPass: string;
  let myChannels = [];
  let allRooms = [];
  let newRoom = {
    name: '',
    password: '',
    isPublic: false,
  };
  let password: string = 'false';
  let blocked: string[] = [];
  let block: any;
  let i: number = 0;

  async function sendInvitation() {
    invitedPlayer.update((n) => currentUser.userName42);
    invitation.update((n) => 'true');
    window.location.replace(`${FRONTEND_URL}/#/pong`);
  }

  function kickUser() {
    socket.emit('kickUser', {
      channel: currentRoom.name,
      userName42: currentUser.userName42,
      minutes: banTime,
    });
  }

  async function createRoom(e) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    if (title.indexOf(' ') != -1 || title.indexOf('\t') != -1) {
      alert('❌ Room name cannot contain white spaces');
      title = '';
      return;
    }
    if (!title || !free) {
      alert('❌ Missing information !');
      return;
    } else if (free != 'true' && !pass) {
      alert('❌ Missing information !');
      return;
    } else if (title.length < 3 || title.length > 10) {
      alert('❌ Room title must be between 3 and 10 characters long');
      return;
    } else if (free != 'true' && (pass.length < 4 || pass.length > 16)) {
      alert('❌ Your password must be between 4 and 16 characters long!');
      return;
    } else {
      newRoom.name = title;
      newRoom.password = pass;
      if (free == 'true') {
        newRoom.isPublic = true;
      } else {
        newRoom.isPublic = false;
      }
      socket.emit('createRoom', newRoom);
    }
  }

  async function muteUser() {
    if (!muteTime) {
      return;
    }
    let time = muteTime;
    socket.emit('muteUser', {
      channel: currentRoom.name,
      userName42: currentUser.userName42,
      minutes: muteTime,
    });
  }

  function removeRoomPass() {
    socket.emit('removePass', { room: currentRoom.name });
    alert('#' + currentRoom.name.toUpperCase() + ' is now a public channel');
    changeRemove = 'false';
  }

  function changeRoomPass() {
    if (newPass?.length < 4 || newPass?.length > 16) {
      alert('❌ Your password must be between 4 and 16 characters long!');
      newPass = '';
    } else {
      socket.emit('changePass', { room: currentRoom.name, pass: newPass });
      newPass = '';
      alert(
        '#' +
          currentRoom.name.toUpperCase() +
          ' is now protected by a new password',
      );
      changeRemove = 'false';
    }
  }

  async function banUser() {
    if (!banTime) {
      return;
    }
    let time = banTime;
    socket.emit('banUser', {
      channel: currentRoom.name,
      userName42: currentUser.userName42,
      minutes: banTime,
    });
  }

  async function makeAdmin() {
    socket.emit('makeAdmin', {
      channel: currentRoom,
      userName42: currentUser.userName42,
    });
  }

  async function removeAdmin() {
    socket.emit('removeAdmin', {
      channel: currentRoom,
      userName42: currentUser.userName42,
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
    rooms = channel.allChannels;
    rooms = [...rooms];
    privateMessages = channel.directMessageChannels;
    privateMessages = [...privateMessages];
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
    socket.emit('joinRoom', { name: currentRoom.name, password: roomPassword });
    roomPassword = '';
  }

  function changeConv(title) {
    socket.emit('changeConv');
    currentRoom = title;
    currentChat.update((n) => title.name);
    currentUser = '';
    currentProfile.update((n) => '');
    messages = currentRoom.messages;
  }

  function changeConvMessages(title) {
    socket.emit('changePrivateConv');
    currentRoom = title;
    currentChat.update((n) => title.name);
    for (let i = 0; i < currentRoom.users.length; i++) {
      if (currentRoom.users[i].id != $id) {
        currentUser = currentRoom.users[i];
      }
    }
  }

  function sendMessage() {
    if (validateInput()) {
      socket.emit('message', { channel: currentRoom, text: Otext });
      Otext = '';
    }
  }

  function receivedMessage(message) {
    if (currentRoom && currentRoom.id == message.channel.id) {
      messages = [...messages, message];
    }
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

  async function createPrivateMessage() {
    await socket.emit('createPrivateMessage', currentUser.userName42);
  }

  onMount(async () => {
    if ($logged == 'true') {
      block = await fetch(`${BACKEND_URL}/users/${$id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: 'Bearer ' + $cookie,
          'Content-type': 'application/json; charset=UTF-8',
        },
      }).then((response) => (block = response.json()));
      blocked = block.blocked;

      socket = io(`${BACKEND_URL}/chat`, {
        auth: { token: $cookie },
      });

      socket.on('updateChannels', (update) => {
        updateChannels(update);
      });

      socket.on('init', (init) => {
        initAll(init);
      });

      socket.on('alert', (alert) => {
        alert(alert);
      });

      socket.on('createChannel', (channel) => {
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

      socket.on('youHaveBeenKicked', (message) => {
        alert('You have been banned from channel #' + message.toUpperCase());
        currentRoom = '';
        currentUser = '';
        currentProfile.update((n) => '');
        currentChat.update((n) => '');
        myChannels = myChannels.filter((t) => t != message);
      });

      socket.on('youAreNowAdmin', (message) => {
        alert('You are now an administator on channel #' + message);
        location.reload()
      });

      socket.on('youAreNoMoreAdmin', (message) => {
        alert('You are no longer an administator on channel #' + message);
      });

      socket.on('privateMessageDeleted', (message) => {
        alert(`The private message channel ${message} was deleted`);
        if (message == currentRoom.name) {
          currentRoom = '';
          currentChat.update((n) => '');
          currentUser = '';
          currentProfile.update((n) => '');
        }
      });

      socket.on('createRoomResponse', (message) => {
        if (message == 'exists') {
          alert(
            '❌ a Room of that name already exists. Please choose another name',
          );
        } else {
          alert(`✅ Chatroom ${title} has been created`);
          creation = false;
          pass = '';
          title = '';
          free = '';
        }
      });

      socket.on('updatePrivateMessages', (message) => {
        privateMessages = message;
        privateMessages = [...privateMessages];
        for (let i = 0; i < privateMessages.length; i++) {
          if (privateMessages[i].name == currentRoom.name) {
            currentRoom = privateMessages[i];
            messages = currentRoom.messages;
          }
        }
      });

      socket.on('kickUserResponse', (response) => {
        if (response == 'true') {
          alert(
            currentUser.userName +
              ' has been kicked from room #' +
              currentRoom.name.toUpperCase(),
          );
          currentUser = '';
          currentProfile.update((n) => '');
        }
      });

      socket.on('muteUserResponse', (response) => {
        let time = muteTime;
        if (response == 'true') {
          alert(
            currentUser.userName + 'has been muted for ' + time + ' minutes',
          );
        } else if (response == 'muted') {
          alert(
            currentUser.userName + `has already been muted for a longer period`,
          );
        } else {
          alert('User ' + currentUser.userName + ' could not be muted');
        }
        muteOptions = 'false';
        muteTime = 0;
      });

      socket.on('banUserResponse', (response) => {
        let time = banTime;
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
        banOptions = 'false';
        banTime = 0;
      });

      socket.on('messageResponse', (message) => {
        if (message == 'muted') {
          Mutes = [...Mutes, currentRoom.name];
        }
        if (message == 'unmuted') {
          Mutes = Mutes.filter((t) => t != currentRoom.name);
        }
      });

      socket.on('joinRoomResponse', (response) => {
        if (response == 'true') {
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

      socket.on('makeAdminResponse', (response) => {
        if (response == 'false') {
          alert('😱 😱 😱 Operation failed');
        } else if (response == 'alreadyAdmin') {
          alert(
            currentUser.userName +
              ' is already an administrator on this channel',
          );
        } else if (response == 'true') {
          alert(
            currentUser.userName +
              ' is now an administrator of channel #' +
              currentRoom.name.toUpperCase(),
          );
        }
        banOptions = 'false';
        muteOptions = 'false';
        location.reload();
      });

      socket.on('removeAdminResponse', (response) => {
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

      socket.on('createPrivateMessageResponse', (newPM) => {
        if (newPM == 'blocked') {
          alert(
            'This user has made impossible for you to start a new conversation 😢 😢 😢',
          );
        }
        if (newPM == 'true') {
          socket.emit('changePrivateConv');
          let DMname = $username + ' - ' + currentUser.userName;
          let inverseDMname = currentUser.userName + ' - ' + $username;
          for (let i = 0; i < privateMessages.length; i++) {
            if (
              DMname == privateMessages[i].name ||
              inverseDMname == privateMessages[i].name
            ) {
              changeConvMessages(privateMessages[i]);
            }
          }
        }
        if (newPM == 'exist') {
          let DMname = $username + ' - ' + currentUser.userName;
          let inverseDMname = currentUser.userName + ' - ' + $username;
          for (let i = 0; i < privateMessages.length; i++) {
            if (
              DMname == privateMessages[i].name ||
              inverseDMname == privateMessages[i].name
            ) {
              changeConvMessages(privateMessages[i]);
            }
          }
        }
      });
    }
  });
</script>

<main>
  {#if $logged == 'true'}
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
            <input
              bind:value={pass}
              type="password"
              placeholder="Enter channel password..."
            />
          {/if}
          <div>
          <button class="create" on:click|preventDefault={createRoom}
            >Create new room</button
          >
          </div>
          <button
            style="border: none; background-color: transparent; font-size: 36px;"
            on:click|preventDefault={() => {
              creation = false;
              pass = '';
              title = '';
              free = '';
              password = 'false';
            }}>🔙</button
          >
        </div>
      </div>
    {:else}
      <!-- CHAT INTERFACE -->
      <div class="header">
        <h1 style="text-align:center" class="text-center">Pong Chat</h1>
        {#if currentRoom}
          {#if currentRoom.isDirectMessage != true}
            <h3 id="roomTitle">Room #{currentRoom.name.toUpperCase()}</h3>
          {:else}
            <h3 id="roomTitle">
              Conversation {currentRoom.name}
            </h3>
          {/if}
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
                  style="color: slategrey; padding: 5px 10px;background-color: lightblue"
                  id="selectMyOwnRoom"
                  on:click|preventDefault={() => changeConv(room)}
                  >#{room.name.toUpperCase()}</button
                ><br />
              {:else if room.channelOwnerId == $id}
                <button
                  style="color: lightblue;"
                  id="selectMyOwnRoom"
                  on:click|preventDefault={() => changeConv(room)}
                  >#{room.name.toUpperCase()}</button
                ><br />
              {:else if myChannels.indexOf(room.name) != -1 && room == currentRoom}
                <button
                  style="color: slategrey; padding: 5px 10px;background-color: lightgreen"
                  id="selectMyRoom"
                  on:click|preventDefault={() => changeConv(room)}
                  >#{room.name.toUpperCase()}</button
                ><br />
              {:else if myChannels.indexOf(room.name) != -1}
                <button
                  style="color:lightgreen"
                  id="selectMyRoom"
                  on:click|preventDefault={() => changeConv(room)}
                  >#{room.name.toUpperCase()}</button
                ><br />
              {:else}
                <button
                  id="selectRoom"
                  on:click|preventDefault={() => changeConv(room)}
                  >#{room.name.toUpperCase()}</button
                ><br />
              {/if}
            {/each}
          </div>
          <!--Private Messages-->
          <div class="privateMessages">
            <h4 class="sectionTitle">Messages</h4>
            {#each privateMessages as privateMessage}
              {#if privateMessage == currentRoom}
                <button
                  style="color: white; background-color: darkslategrey"
                  id="selectPrivMsg"
                  on:click|preventDefault={() =>
                    changeConvMessages(privateMessage)}
                >
                  {privateMessage.users[0].id == $id
                    ? privateMessage.users[1].userName42.toUpperCase()
                    : privateMessage.users[0].userName42.toUpperCase()}
                </button><br />
              {:else}
                <button
                  id="selectPrivMsg"
                  on:click|preventDefault={() =>
                    changeConvMessages(privateMessage)}
                >
                  {privateMessage.users[0].id == $id
                    ? privateMessage.users[1].userName42.toUpperCase()
                    : privateMessage.users[0].userName42.toUpperCase()}
                </button><br />
              {/if}
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
                <button
                  class="joinButton"
                  on:click|preventDefault={() => joinRoom()}>Join room</button
                >
              {:else if currentRoom.isPublic == false && myChannels.indexOf(currentRoom.name) == -1}
                <h3 style="margin-top: 30px;">
                  This room is password protected
                </h3>
                <form on:submit|preventDefault={joinRoom}>
                  <input
                    style="width: 100%"
                    class="form-control"
                    type="password"
                    bind:value={roomPassword}
                    placeholder="Enter room password..."
                  />
                </form>
              {:else}
                {#each messages as msg}
                  {#if blocked.indexOf(msg.user.id.toString()) == -1}
                    {#if msg.user.userName == $username}
                      <p class="selfmsg">
                        {msg.text}
                      </p>
                    {:else if currentRoom.isDirectMessage == true}
                      <p class="othermsg">
                        {msg.text}
                      </p>
                    {:else}
                      <p class="othermsg">
                        <span style="font-weight: 700; color: darkgreen"
                          >{msg.user.userName}</span
                        ><br />
                        {msg.text}
                      </p>
                    {/if}
                  {/if}
                {/each}
              {/if}
            {/if}
          </div>
          <div class="my-buttons">
            <form class="form-control" on:submit|preventDefault={sendMessage}>
              <input bind:value={Otext} placeholder="Enter message..." />
            </form>
            <button class="sendButton" on:click|preventDefault={sendMessage}
              >⏎</button
            >
          </div>
          <div class="my-buttons">
            <button
              id="createRoom"
              on:click|preventDefault={() => (creation = true)}
              >Create new room</button
            >
            {#if currentRoom && currentRoom.isDirectMessage == true}
              <button
                id="leaveRoom"
                on:click|preventDefault={() =>
                  deletePrivateMessage(currentRoom)}
                >Delete Private Conversation</button
              >
            {:else if currentRoom && currentRoom.channelOwnerId == $id}
              <button
                id="leaveRoom"
                on:click|preventDefault={() => deleteRoom(currentRoom)}
                >Delete Room</button
              >
            {:else if currentRoom && myChannels.indexOf(currentRoom.name) != -1}
              <button
                id="leaveRoom"
                on:click|preventDefault={() => leaveRoom(currentRoom)}
                >Leave Room</button
              >
            {/if}
          </div>
          {#if currentRoom && currentRoom.channelOwnerId == $id && currentRoom.isPublic == false}
            <div style="margin-top: 5px;" class="my-buttons">
              <button
                id="createRoom2"
                on:click|preventDefault={() => {
                  changeRemove = 'true';
                }}>Change password</button
              >
              <button id="leaveRoom2" on:click={removeRoomPass}
                >Remove password</button
              >
            </div>
            {#if changeRemove == 'true'}
              <form on:submit|preventDefault={() => changeRoomPass}>
                <input
                  style="width: 100%; margin-top:10px;"
                  class="form-control"
                  type="password"
                  bind:value={newPass}
                  placeholder="Enter new password..."
                />
              </form>
              <button on:click|preventDefault={changeRoomPass}>Submit</button>
            {/if}
          {/if}
        </div>

        <!--PROFILE-->
        <div class="column3">
          <h4 class="sectionTitle2">Users</h4>
          {#if currentRoom && myChannels.indexOf(currentRoom.name) != -1 && !currentUser}
            <div style="margin-top: 15px;">
              {#each currentRoom.users as user}
                <button
                  on:click|preventDefault={() => {
                    updateCurrentUser(user);
                  }}
                  id="selectUser"
                >
                  <img
                    class="listAvatar"
                    src={user.imageURL}
                    alt="profilePic"
                  />
                  {user.userName}</button
                >
              {/each}
            </div>
          {/if}
          {#if currentUser}
            {#if currentRoom.isDirectMessage == false}
              <button
                style="cursor: pointer;display: block; text-align: right; border: none; margin-bottom: -10px; color: black"
                on:click|preventDefault={() => {
                  currentUser = '';
                  currentProfile.update((n) => '');
                }}>X</button
              >
            {/if}
            {#if currentUser.id == $id}
              <a
                href="{`${FRONTEND_URL}/#/profile`}"
                class="profileLink"
                style="color: black; font-size:16px;"
                ><img
                  class="profile"
                  src={$image_url}
                  alt="profile"
                />{currentUser.userName}</a
              >
            {:else if currentRoom.isDirectMessage == true}
              <a
                href="{`${FRONTEND_URL}/#/userprofile`}"
                on:click={() => {
                  otherUser.update((n) => currentUser.id);
                }}
                class="profileLink"
                style="color: darkred; font-size:16px;"
                ><img
                  class="profile"
                  src={currentUser.imageURL}
                  alt="profile"
                /><b>{currentUser.userName}</b></a
              >
              <button
                on:click|preventDefault={sendInvitation}
                class="profileButton"
                style="background-color: dodgerblue; color: white"
                >Invite to play 🏓</button
              >
            {:else}
              <a
                href="{`${FRONTEND_URL}/#/userprofile`}"
                on:click={() => {
                  otherUser.update((n) => currentUser.id);
                }}
                class="profileLink"
                style="color: darkred; font-size:16px;"
              >
                <img
                  class="profile"
                  src={currentUser.imageURL}
                  alt="profile"
                /><b>{currentUser.userName}</b></a
              >
              <button
                on:click|preventDefault={createPrivateMessage}
                class="profileButton"
                style="color: white; background-color: rgb(224, 62, 62)"
                >Send PM ✉️</button
              >
              <button
                on:click|preventDefault={sendInvitation}
                class="profileButton"
                style="background-color: dodgerblue; color: white"
                >Invite to play 🏓</button
              >
              {#if currentRoom && (currentRoom.channelOwnerId != currentUser.id) && (currentRoom.channelOwnerId == $id || currentRoom.channelAdminsId.indexOf($id) != -1)}
                <h4>Admin</h4>

                {#if Mutes.indexOf(currentRoom.name) != -1}
                  <button style="color: white; background: red;">Muted</button>
                {:else if currentRoom.channelOwnerId != currentUser.id}
                  <button
                    on:click={() => {
                      if (muteOptions == 'false') {
                        muteOptions = 'true';
                      } else {
                        muteOptions = 'false';
                      }
                      banOptions = 'false';
                    }}
                    class="profileButton"
                    style="background-color: slategrey; color: white"
                    >Mute</button
                  >
                {/if}
                {#if muteOptions == 'true'}
                  <div>
                    <label>
                      <input
                        type="radio"
                        default
                        bind:group={muteTime}
                        value="5"
                      />
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
                    <button on:click|preventDefault={muteUser}>Mute User</button
                    >
                  </div>
                {/if}

                {#if currentRoom.channelOwnerId != currentUser.id}
                  <button
                    on:click={() => {
                      if (banOptions == 'false') {
                        banOptions = 'true';
                      } else {
                        banOptions = 'false';
                      }
                      muteOptions = 'false';
                    }}
                    class="profileButton"
                    style="background-color: slategrey; color: white"
                    >Ban</button
                  >
                {/if}
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
                    <button on:click|preventDefault={banUser}>Ban User</button>
                  </div>
                {/if}
                {#if currentUser.id != currentRoom.channelOwnerId}
                  <button
                    on:click|preventDefault={kickUser}
                    class="profileButton"
                    style="background-color: slategrey; color: white"
                    >Kick</button
                  >
                {/if}
              {/if}
              {#if currentRoom.channelOwnerId == $id && currentRoom.channelAdminsId.indexOf(currentUser.id.toString()) == -1}
                <button
                  style="background-color: gold"
                  on:click|preventDefault={makeAdmin}
                  class="profileButton">Upgrade status</button
                >
              {:else if currentRoom.channelOwnerId == $id && currentRoom.channelAdminsId.indexOf(currentUser.id.toString()) != -1}
                <button
                  style="border: solid 1px brown; color: brown; background-color: transparent"
                  on:click|preventDefault={removeAdmin}
                  class="profileButton">Downgrade status</button
                >
              {/if}
            {/if}
          {/if}
        </div>
      </div>
    {/if}
  {:else}
    <h1 style="text-align:center; color: black">ACCESS DENIED</h1>
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
    color: black;
  }

  #roomTitle {
    font-size: 16px;
    font-weight: 600;
    background-color: slategrey;
    color: white;
    padding: 10px;
    text-align: center;
    margin-bottom: 0px;
  }

  #messages {
    height: 500px;
    overflow-y: scroll;
    margin: 0 auto;
    align-items: center;
    max-width: 600px;
    margin: 0 auto;
    background-color: ghostwhite;
    display: flex;
    flex-flow: column;
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
    border-radius: 8px;
    text-align: right;
    padding: 10px;
    max-width: 50%;
    margin-top: -7px;
    margin-right: 10px;
    align-self: flex-end;
    display: block;
  }
  .othermsg {
    background-color: rgb(173, 230, 175);
    color: black;
    border-radius: 8px;
    margin-top: -7px;
    text-align: left;
    padding: 10px 20px 10px 15px;
    max-width: 50%;
    margin-left: 10px;
    align-self: flex-start;
    display: block;
  }

  .row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    height: 500px;
  }

  .column1 {
    display: flex;
    vertical-align: text-bottom;
    flex-direction: column;
    flex: 1.5;
    border-right: lightgray;
    background-color: slategrey;
    overflow: auto;
  }

  .rooms {
    text-align: left;
    padding-left: 5px;
  }

  .privateMessages {
    text-align: left;
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
  }

  .sectionTitle {
    background-color: whitesmoke;
    color: slategrey;
    padding: 5px 15px 5px;
    border: 2px solid slategray;
    text-align: center;
  }

  .sectionTitle2 {
    background-color: transparent;
    color: slategrey;
    padding: 5px 15px 5px;
    margin-bottom: 0;
    border-top: 2px solid slategrey;
    border-bottom: 2px solid slategrey;
  }

  #selectUser {
    font-size: 16px;
    cursor: pointer;
    margin-left: 10px;
    font-weight: 400;
    line-height: 0.5;
    color: black;
    background-color: transparent;
    border: none;
    display: block;
    text-align: left;
  }

  #selectMyRoom {
    cursor: pointer;
    font-size: 12px;
    margin-left: 10px;
    font-weight: 600;
    color: green;
    background-color: transparent;
    border: none;
    text-align: left;
  }

  #selectMyOwnRoom {
    cursor: pointer;
    font-size: 12px;
    margin-left: 10px;
    font-weight: 600;
    background-color: transparent;
    border: none;
    text-align: left;
  }

  #selectRoom {
    cursor: pointer;
    font-size: 12px;
    margin-left: 10px;
    font-weight: 600;
    background-color: transparent;
    border: none;
    color: gainsboro;
    text-align: left;
  }

  #selectPrivMsg {
    cursor: pointer;
    font-size: 12px;
    margin-left: 10px;
    font-weight: 600;
    background-color: transparent;
    color: gainsboro;
    border: none;
    text-align: left;
  }

  .my-buttons {
    cursor: pointer;
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
    cursor: pointer;
    background-color: darkslateblue;
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
    padding: 8px 8px;
    border-radius: 5px;
    text-align: center;
    color: white;
    background-color: steelblue;
  }

  #createRoom2 {
    cursor: pointer;
    flex: 1 0 40%;
    margin: 0 auto;
    padding: 8px 8px;
    border-radius: 5px;
    text-align: center;
    color: white;
    background-color: darkslategray;
  }

  #leaveRoom {
    cursor: pointer;
    flex: 1 0 50%;
    margin: 0 auto;
    border-radius: 5px;
    background-color: darkred;
    border: none;
    color: white;
  }

  #leaveRoom2 {
    cursor: pointer;
    flex: 1 0 50%;
    margin: 0 auto;
    border-radius: 5px;
    background-color: darkslateblue;
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
    cursor: pointer;
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
    position: relative;
    top: 8px;
    margin: 0 auto;
    margin-right: 5px;
    align-self: center;
    background-size: contain;
    background-position: center;
    border-radius: 50%;
    border: 1px solid dimgrey;
  }

  .joinButton {
    width: 100px;
    font-weight: 600;
    margin-top: 100px;
    padding: 15px;
    background-color: firebrick;
    color: white;
    border: none;
    border-radius: 5px;
    transition: transform 0.1s;
  }
  .joinButton:hover {
    transform: scale(1.1);
  }
</style>
