<script lang='ts'>
  export let waiting: String = 'false';

  function gameRequest() {
    waiting = 'true';
    waiting = waiting;
  }
</script>

<main>
  <div class=homescreen>
    {#if waiting == 'false'}
    <img on:click={gameRequest} class='play_svg' src='img/play.svg' alt='play_logo'/><br><br>
    <button on:click={gameRequest} class='play'>▶︎</button>
    {:else}
    <h2 style='color:white; text-align: center; padding-top:150px;'>Waiting for other players...</h2>
    <button on:click={() => {waiting = 'false'}} class='cancel_button'>Cancel</button>
    {/if}

  </div>
</main>

<style>

  main {
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    align-items: center;
  }

  .homescreen {
    margin: 0 auto;
  margin-top: 50px;
  display: block;
  height:450px;
  width:800px;
  background-color: rgb(30,30,30);
  }
.play {
  cursor: pointer;
   margin: 0 auto;
  display: block;
  background-color: transparent;
  border: none;
  color: white;
  font-size: 100px;
  transition: transform .1s; 
}
.play:hover {
  transform: scale(1.2); 
}

.play_svg {
  cursor: pointer;
  width: 200px;
  padding-top: 100px;
  display: block;
  margin: 0 auto;
}

.cancel_button {
  background-color: transparent;
  border: solid 1px white;
  color: white;
  display: block;
  margin:0 auto;
  margin-top: 30px;
  transition: transform .1s; 
}

.cancel_button:hover {
  transform: scale(1.2);
  color:white;
  background-color: darkred; 
  border: none;
}

</style>