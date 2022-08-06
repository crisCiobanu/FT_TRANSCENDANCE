<script>
    import { onMount } from "svelte";
    import { level, logged, losses, username, wins, image_url, firstname, lastname } from '../stores.js';

    let uid = 4;
     let text = "";
     let messagesRef;
     let messages = [];
     let channel;
  
     const appendMessage = message => {
        requestAnimationFrame(() => {
          messagesRef.scrollTop = messagesRef.scrollHeight;
        })
      };

     function sendMessage() { 
       if (text === "") {
        return;  
       }
       channel.sendMessage({ text, type: "text" });
      appendMessage({
        text: text,
        uid
      });
      text = "";
      console.log({text});
      array.update(n => n.push(text));
      requestAnimationFrame(() => {
         messagesRef.scrollTop = messagesRef.scrollHeight;
    });
  }
  </script>
  
   <main>
     {#if $logged}
     <h1 style="text-align: center; font-weight: 700;">Chat with your friends!</h1>
     <div class="panel">
       <div class="messages" bind:this={messagesRef}>
         <div class="inner">
           {#each messages as message}
             <div class="message">
               {#if message.uid === uid}
                <div class="text1">{$username}: {message.text}</div>
               {:else}
               <div class="text2">{message}</div>
            {/if}
             </div>
           {/each}
         </div>
       </div>
  
       <form on:submit|preventDefault={sendMessage}>
         <input bind:value={text} />
       </form>
     </div>
     {:else}
     <h1 style="text-align: center; font-weight: 700;">ACCESS DENIED</h1>                  
     {/if}
   </main>

   <style>
     :root {
            font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  
      background: white;
     } 
  
  main {
           font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  } 
  
     .panel {
       display: flex;
       flex-direction: column;
       padding: 5px;
      margin: 0 auto;
       margin-top: 50px;
       max-width: 700px;
       height: 500px;
       background: rgb(0, 0, 0);
       backdrop-filter: blur(4px);
     }
  
     .messages {
       height: 100%;
       width: 100%;
       overflow-y: scroll;
       display: block;
       background-color: white;
     }

     .text1 {
         padding: 10px;
         background-color: rgb(127, 173, 214);
         border-radius: 5px;
         align-items: right;
         align-content: right;
        position: right;
         display: block;
     }

     .text2 {
         padding: 10px;
         background-color: rgb(127, 214, 150);
     }


  
    .inner {
      padding: 10px;
    }
  
     .message {
      text-align: left;
       display: flex;
       margin-bottom: 6px;
       font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
     }
  
  
     form {
      position: relative;
      display: flex;
    }
  
     input {
       width: 100%;
      border: none;
       height: 40px;
       padding: 8px;
      border-top: 3px solid rgb(0, 0, 0);
       border-radius: 0px;
      outline: none;
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
         }
   </style>  
