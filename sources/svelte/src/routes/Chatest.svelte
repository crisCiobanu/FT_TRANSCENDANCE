<script lang='ts'>
    import { level, logged, losses, username, wins, image_url, firstname, lastname, id, cookie, TWOFA, ownmail, email, currentRoom } from '../stores.js';
    import {onMount} from 'svelte';
    import io from 'socket.io-client';
    let title = 'Pong Chat';
    let Oname = $username;
    let Otext = '';
    let messages = [];
    let privateMessages = ['Bot'];
    let socket = null;
    let roomTitle = $currentRoom;
    let rooms = ['general', 'game'];

    async function changeConv(title: string) {
        console.log(title);
        roomTitle = title;
        currentRoom.update(n => title);
        // await fetch('http://localhost:3000/channels/' + title,
        // {
        //     method: "GET",
        //     headers:
        //     {
        //         'Authorization' : 'Bearer ' + $cookie,
        //     }}
        // ).then(response => messages = response.json())
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
    }

    onMount( async () => {
        socket =  io('http://localhost:3000');
     socket.on('msgToClient', (message) => {
      receivedMessage(message)
     })
    //  channels = await fetch('http://localhost:3000/rooms', {
    //     method: 'GET',
    //     headers:
    //     {
    //          'Authorization' : 'Bearer ' + $cookie,
    //     }
    // }).then(response => channels = response.json());

     })

</script>

<main>
            <h1 style="text-align:center" class="text-center">{title}</h1>
            {#if roomTitle == ''}
            <h3 style="font-size:16px;background-color: slategrey; color: white; padding:5px; text-align: center; margin-bottom:0px;">No room selected</h3>
            {:else}
            <h3 style="font-size:16px;background-color: slategrey; color: white; padding:5px; text-align: center; margin-bottom:0px;">{roomTitle.toUpperCase()}</h3>
            {/if}
            <div class='row'>
            <div class='column1'>
                <h4 style="background-color: rgb(240, 240, 240) ; color: slategrey; padding: 5px 15px 5px;">Rooms</h4>
                <div>
                    {#each rooms as room}
                <button on:click={() => changeConv(room)} style="font-size: 12px; margin-left:10px; font-weight: 600;background-color:lightgrey;border:none; text-align: left">#{room.toUpperCase()}</button><br>
                {/each}
                <h4 style="background-color: rgb(240, 240, 240);color:slategrey; padding: 5px 15px 5px;">Messages</h4>
                {#each privateMessages as privateMessage}
                <button on:click={() => changeConv(privateMessage)} style="font-size: 12px; margin-left:10px; font-weight: 600;background-color:lightgrey;border:none; text-align: left">#{privateMessage.toUpperCase()}</button><br>
                {/each}    
            </div>
            </div>
            <div id="chat" class='column2'>
                <div id="messages" >
                    {#if roomTitle == ''}
                        <h3 style="text-align: center"><br>Please select a room to start chatting<br></h3>
                    {:else} 
                        {#each messages as msg}
                        {#if msg.name == $username}
                            <p class="selfmsg">{msg.text}</p>
                        {:else}
                            <p class="othermsg">{msg.name}: {msg.text}</p>
                        {/if}
                        {/each}
                    {/if}
                </div>
                <form on:submit|preventDefault={sendMessage}>   
                    <input style="width: 100%" class="form-control" bind:value={Otext} placeholder="Enter message..." />
                    </form>
                    <a style="  padding: 5px 5px; text-align: center; display: block; color: white;background-color: darkslategrey" href="#/newroom">Create new room</a>
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
	/* color: rgb(235, 235, 235); */
	display: block;
	/* flex-flow: column wrap; */
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
   /* text-align: center; */
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
  /* align-items: flex-start; */
}

.column1 {
  display: flex;
  /* height: 300px;  */
  vertical-align: text-bottom;
  /* align-items: flex-start; */
  flex-direction: column;
  flex-basis: 100%;
  flex: 1;
  border-right: lightgray;
  border: 2px black;
  background-color: lightgrey;
  /* margin-right:10px; */
  /* min-width:8rem; */
  /* padding: 10px; */
}

.column2 {
  display: flex;
  flex-direction: column;
  flex-basis: 100%;
  flex: 5;
  padding-left: 10px;
  background-color: ghostwhite;
}



</style>