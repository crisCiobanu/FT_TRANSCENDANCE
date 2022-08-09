<script lang='ts'>
    import { level, logged, losses, username, wins, image_url, firstname, lastname, id, cookie, TWOFA, ownmail, email } from '../stores.js';
    import {onMount} from 'svelte';
    import io from 'socket.io-client';
   export let Oname = $username;
    export let Otext = '';
    export let messages = [];
    export let privateMessages = [];
    export let socket = null;
    export let rooms = [];
    // export let rooms = [{'name': 'general', 'public': true, 'users': ['a', 'b', 'c', 'd']}, {'name': 'game', 'public': false, 'users': []}, {'name': 'test', 'public': true, 'users': []}];
   export  let currentRoom;
   export  let roomPassword: string = '';
   export let myRooms = [];
    // export let myRooms = [rooms[0]];
    export let currentUser;

    function initAll(init) {
        console.log("A");
        console.log(init);
        rooms = init.allChannels;
        myRooms = init.userChannels;
        privateMessages = init.directMessageChannels;
    }

    function userOptions() {

    }
    function leaveRoom(room) {
        alert('You left room ' + room.name);
        myRooms = myRooms.filter(t => t != room);
        console.log(myRooms);
    }

    function joinRoom(room) {
        myRooms = [...myRooms, room]
        alert('You successfully joined room ' + room.name);
        console.log(myRooms);
    }

    async function changeConv(title) {
     //   console.log(title);
        currentRoom = title;
      //  currentRoom.update(n => title.name);
        // await fetch('http://localhost:3000/channels/' + title,
        // {
        //     method: "GET",
        //     headers:
        //     {
        //         'Authorization' : 'Bearer ' + $cookie,
        //     }}
        // ).then(response => messages = response.json())
    }

    async function sendRoomPassword(room) {
        // await fetch('localhost:3000/channels/password', {
        //     method: 'POST',
        //     headers:
        //     {
        //         'Authorization' : 'Bearer ' + $cookie,
        //     }
        // }).then(response => {
        //     if (response.status == 200) {
        //         myRooms = [...myRooms, room]
        //     }
        // })
        myRooms = [...myRooms, room];
        alert('You successfully jointed room ' + room.name);
        console.log(myRooms);
        console.log(currentRoom);
    }

    function sendMessage() {
        if(validateInput()) {
            const message = {
                name: Oname,
                text: Otext
            }
            socket.emit('msgToServer', message)
            Otext = ''
        }
    };

    function receivedMessage(message) {
        messages = [...messages, message];
        console.log(messages)
    };

    function validateInput() {
        return Oname.length > 0 && Otext.length > 0
    };

    onMount( async () => {
        socket =  io('http://localhost:3000', { 
            auth: { token: $cookie }
        });

        socket.on('init', (init) => {
        console.log(init);
        initAll(init)
        });

        socket.on('msgToClient', (message) => {
            console.log('msgToClient')
        receivedMessage(message)
        });
     })

</script>


<main>
            <h1 style="text-align:center" class="text-center">Pong Chat</h1>
            {#if currentRoom}
                <h3 id='roomTitle'>{currentRoom.name.toUpperCase()}</h3>
            {:else}
                <h3 id='roomTitle'>Please select a room to start chatting</h3>
            {/if}

        <div class='row'>
            <div class='column1'>
                <h4 class='sectionTitle'>Rooms</h4>
                <div>

                {#each myRooms as myRoom}
                    <button on:click={() => changeConv(myRoom)} id='selectMyRoom'>#{myRoom.name.toUpperCase()}</button><br>
                    {#if myRoom == currentRoom}

                    <div>
                        {#each myRoom.users as user}
                        <button on:click={() => currentUser = user} id='selectUser'>{user}</button><br>
                        {#if currentUser == user}
                            <button>kick</button>
                            <button>ban</button>
                            <button>mute</button>
                        {/if}
                        {/each}
                    </div>
                {/if}
                    {/each}

                {#each rooms as room}  
                    {#if myRooms.indexOf(room) == -1}
                    <button id='selectRoom' on:click={() => changeConv(room)}>#{room.name.toUpperCase()}</button><br>
               {/if}
                    {/each}
                <h4 class='sectionTitle'>Messages</h4>
                {#each privateMessages as privateMessage}
                    <button id='selectPrivMsg' on:click={() => changeConv(privateMessage)}>
                        {privateMessage}
                    </button><br>
                {/each}    
            </div>
         </div>

        <div id="chat" class='column2'>
            <div id="messages" >

            {#if currentRoom}
                {#if myRooms.indexOf(currentRoom) == -1 && currentRoom.public == true}
                     <button on:click={() => joinRoom(currentRoom)}>Join room</button>    
                {:else if currentRoom.public == false && myRooms.indexOf(currentRoom) == -1}
                    <h3>This room is password protected</h3>
                    <form on:submit|preventDefault={() => sendRoomPassword(currentRoom)}>   
                        <input style="width: 100%" class="form-control" bind:value={roomPassword} placeholder="Enter room password..." />
                    </form>

                {:else}
                    {#each messages as msg}
                        {#if msg.name == $username}
                            <p class="selfmsg">{msg.text}</p>
                        {:else}
                            <p class="othermsg">{msg.name}: {msg.text}</p>
                        {/if}
                    {/each}
                {/if}
            {/if}
            
            </div>
                <form on:submit|preventDefault={sendMessage}>   
                    <input style="width: 100%" class="form-control" bind:value={Otext} placeholder="Enter message..." />
                </form>
                <div class='my-buttons'>
                    <a id='createRoom' href="#/newroom">Create new room</a>
                    <button id='leaveRoom' on:click={() => leaveRoom(currentRoom)}>Leave Room</button>
                 </div>
        </div>
    </div>
</main>


<style>

    main {
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        margin: 0 auto;
        align-items: center;
        max-width: 600px;
        margin: 0 auto;
        display: block;
    } 
    
    #roomTitle {
        font-size:16px;
        font-style: italic;
        font-weight: 600;
        background-color: slategrey; 
        color: white; 
        padding:5px; 
        text-align: center; 
        margin-bottom:0px;
    }

    #messages{
        height:300px;
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
    }

    .column1 {
        display: flex;
        vertical-align: text-bottom;
        flex-direction: column;
        flex-basis: 100%;
        flex: 1;
        border-right: lightgray;
        border: 2px black;
        background-color: lightgrey;
    }

    .column2 {
        display: flex;
        flex-direction: column;
        flex-basis: 100%;
        flex: 5;
        padding-left: 10px;
        background-color: ghostwhite;
    }

    .sectionTitle {
        background-color: rgb(240, 240, 240) ; 
        color: slategrey; 
        padding: 5px 15px 5px;
    }

    #selectUser {
        color: dimgrey; 
        line-height: 0.1; 
        margin-top: 0px; 
        margin-left: 20px;
    }

    #selectMyRoom {
        font-size: 12px; 
        margin-left:10px; 
        font-weight: 600; 
        color: green;
        background-color:lightgrey;
        border:none; 
        text-align: left;
    }

    #selectRoom {
        font-size: 12px; 
        margin-left:10px; 
        font-weight: 600;
        background-color:lightgrey;
        border:none; 
        text-align: left

    }

    #selectPrivMsg {
        font-size: 12px; 
        margin-left:10px; 
        font-weight: 600;
        background-color:lightgrey;
        border:none; 
        text-align: left;
    }

    .my-buttons {
        display: flex;
        justify-content: center;
    }

    #createRoom {
        cursor: pointer;
        flex: 1 0 40%;
        margin: 0 auto;
        padding: 5px 5px; 
        border-radius: 0;
        text-align: center; 
        color: white;
        background-color: lightslategrey
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



</style>