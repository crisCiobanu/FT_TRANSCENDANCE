<script>
    import { level, logged, losses, username, wins, image_url, firstname, lastname, id, cookie, TWOFA, ownmail, email } from '../stores.js';
    let pass;
    let free;
    let title
    let channelName;
    let password = 'false';
   
    function createRoom() {
      if (!title || (free == 'private' && !pass)) {
        alert('Missing information !');
      }
      else {
        alert(`✅ Chatroom ${title} has been created`);
      }
    }

    function addPassword() {
      password = 'true';
      password = password;
    }

    function removePassword() {
      password = 'false';
      password = password;
    }

  </script>
  
  <main>
    <h2>New Chat Room</h2>

    <input bind:value={title} placeholder="Chat room's name" />
    <div >
    <label>
      <input on:click={removePassword} type=radio bind:group={free} value='public'>
      Public
    </label>
    
    <label>
      <input on:click={addPassword} type=radio bind:group={free} value='private'>
      Private
    </label>
  </div>
  <br>
  <div>
    <!-- <button on:click={addPassword}>
    Protect with password
    </button> -->
  {#if password == 'true'}
     <input bind:value={pass} placeholder="Enter channel password..." />
  {/if}
  <div>
    {#if !title || !free || (free == 'private' && !pass)}
    <button  on:click={createRoom} style=" padding: 10px;background-color: darkred; color: white;">Create new chat room</button>
    {:else}
    <a href='#/chat' on:click={createRoom} style=" padding: 10px;background-color: darkred; color: white;">Create new chat room</a>
    {/if}
  </div>


  </main>
  
  
  
  <style>
         main {
            align-items: center;
            align-content: center;
            text-align: center;
            display: block;
            margin: 0 auto;
            margin-top: 30px;
            font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
          }
      
  
  </style>