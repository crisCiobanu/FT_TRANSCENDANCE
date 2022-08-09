
<script>
    import {cookie} from '../stores.js';
    export let pass;
    export let free;
    export let title
    export let channelName;
    export let password = 'false';
   
    async function createRoom() 
    {
        if (!title || (free == 'private' && !pass)) {
          alert('❌ Missing information !');
        }
        
        else 
        {
          console.log(title);
          console.log(pass);
          console.log(free);
          await fetch ('http://localhost:3000/chat/createRoom', {
            method: 'POST',
            body: JSON.stringify({
              "name": title, "password": pass, "public": free
            }),
            headers: {
              'Authorization' : 'Bearer ' + $cookie,
              "Content-type": "application/json; charset=UTF-8"
            },
          })
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
          <input on:click={removePassword} type=radio bind:group={free} value=true>
          Public
        </label>
        
        <label>
          <input on:click={addPassword} type=radio bind:group={free} value=false>
          Private
        </label>
    </div>
     <br>
    <div>
    {#if password == 'true'}
      <input bind:value={pass} placeholder="Enter channel password..." />
    {/if}
    <div>
        {#if !title || !free || (free == false && !pass)}
           <button class='create'  on:click={createRoom}>Create new room</button>
        {:else}
           <a href='#/chat' on:click={createRoom}>Create new room</a>
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

          .create {
            padding: 10px;
            background-color: darkred; 
            color: white;
          }
  </style>