<script lang='ts'>
    import { onMount } from 'svelte';
    import { level, logged, losses, username, wins, image_url, firstname, lastname, id } from '../stores.js';
  //  import HomeForm from "../components/HomeForm.svelte"
    
    let fileinput;
    let avatar;
    const onFileSelected =(e)=>{
        let image = e.target.files[0];
     //   console.log(image);
        var data = new FormData();
      //  var file = document.getElementById('my-file-element').files[0]
        data.append('image', image);
        data.append('id', $id.toString());
        console.log(data.get('image'));
        console.log(data.get('id'));
     //   data.append('id', $id);
            // let reader = new FileReader();
            // reader.readAsDataURL(image);
            // reader.onload = e => {
            //      avatar = e.target.result
            //      image_url.update(n => avatar);
            //      console.log(avatar);
                 fetch('http://localhost:3000/users/updateimage/', {
                    method: 'post',
                    body: data,
                
                 });
                
            };  

    onMount(async () => {
        avatar = {$image_url};
    }
);
</script>


<main>
    {#if $logged}
    <div>
        <img class="profile" src={$image_url} width="200px" alt="Default Profile" /> 
    </div>
    <div>
        <p style="text-align:center; color:grey; font-weight:500">{$firstname} {$lastname}</p>
        <h1 class="name">{$username}</h1>
    </div>
    <div>
        <button class="bt1" on:click={()=>{fileinput.click();}}>Change profile picture</button>
        <input style="display:none" type="file" accept=".jpg, .jpeg, .png" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
    </div>
    <div style="margin: 0 auto; width: 200px;">
        <a class="bt2" href="#/user">Change user name</a>
    </div>
    <div class="tb1">
        <h1><span class="sp1">WINS   </span> <span class="sp2">     {$wins}</span></h1>
        <h1><span class="sp1">LOSSES   </span> <span class="sp2">       {$losses}</span></h1>
        <h1><span class="sp1">LEVEL   </span><span class="sp2">  {$level}</span></h1>
        <h1><span class="sp1">ID   </span><span class="sp2">  {$id}</span></h1>
    </div>
    {:else}
    <h1 style="text-align: center">ACCESS DENIED</h1>
{/if}
</main>

<style>

    main {
        display: grid;
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        align-items: center;
        margin: 0 auto;
    }
    .profile {
        margin: 0 auto;
        margin-top: 50px;
        display: block;
        align-items: center;
        align-content: center;
        border-radius: 50%;
        border: solid 10px lightgray;
    }
    .name {
        text-align: center;
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        font-size: 3rem;
    }

    .tb1 {
        margin: 0 auto;
        margin-top: 70px;
        display: block;
        text-align: center;
        align-items: center;
    } 
    .sp1{
        font-weight: 700;
        font-size: 2rem;
    }
    .sp2 {
        font-weight: 400;
        font-size: 2rem;;
    }
    .bt1 {
        margin: 0 auto;
        align-items: center;
        width: 200px;
        text-align: center;
        display: block;
        background-color: rgb(224, 62, 62);
        color: white;
        padding: 10px;
    }
     .bt2 {
        margin: 0 auto;
        align-items: center;
        background-color: rgb(2, 84, 131);
        color: white;
        padding: 10px;
        /* width: 200px; */
        align-items: center; 
        display: block; 
        text-align:center;
    }
    /* form { 
       display: grid;
       align-items: center;
       position: center;
       margin: 0 auto;
       display: block;
    } */
</style>