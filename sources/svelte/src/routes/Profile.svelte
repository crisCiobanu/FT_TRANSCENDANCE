<script lang='ts'>
    import { onMount } from 'svelte';
    import { level, logged, losses, username, wins, image_url, firstname, lastname, id, TWOFA, cookie } from '../stores.js';

    let fileinput;
    let newImage;

    async function TWOFAon() 
    {
        if ($TWOFA == 'false')
        {
            await fetch('http://localhost:3000/users/twofa', {
                method: "POST",
                headers:
                {
                    'Authorization' : 'Bearer ' + $cookie,
                }
            });
            TWOFA.update(n => 'true');
            alert("✅ Two factor authentification has been enalbled on this account");
        }
        else
        {
            alert("❌ Two factor authentication is already enabled!")
        }
    }

    async function TWOFAoff() 
    {
        if ($TWOFA == 'true')
        {
            await fetch('http://localhost:3000/users/twofa', {
                method: "POST",
                headers:
                {
                    'Authorization' : 'Bearer ' + $cookie,
                }
            });
            TWOFA.update(n => 'false');
            alert("✅ Two factor authentication has been disabled on this account");
        }
        else
        {
            alert("❌ Two factor authentication is already disabled!")
        }
    }

    async function onFileSelected(e) 
    {
        let image = e.target.files[0];
        var data = new FormData();
        data.append('file', image);
        data.append('id', $id.toString());
        console.log(data.get('image'));
        console.log(data.get('id'));
             newImage =  await fetch('http://localhost:3000/users/updateimage/', {
                    method: 'post',
                    body: data,
                    headers: {
                    'Authorization': 'Bearer ' + $cookie,
                    },
                
                 })
                  .then(response => newImage = response.json());

                 console.log(newImage.url);
                 image_url.update(n => (newImage.url));
                
    };  

    onMount(async () => {
    }
);
</script>


<main>
    {#if $logged == 'true'}
    <div>
        <img class="profile" src={$image_url} width="200px" alt="Default Profile" /> 
    </div>
    <div>
        <p style="text-align:center; color:grey; font-weight:500">{$firstname} {$lastname}</p>
        <h1 class="name" style="color:goldenrod">{$username}</h1>
    </div>
    <!-- <div>
        <button class="bt1" on:click={()=>{fileinput.click();}}>Change profile picture</button>
        <input style="display:none" type="file" accept=".jpg, .jpeg, .png" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
    </div> -->
    <!-- <div style="margin: 0 auto; width: 200px;">
        <a class="bt2" href="#/user">Change user name</a>
    </div> -->
    <div style="margin: 0 auto; margin-top: 10px;">
                <button class="bt1" on:click={()=>{fileinput.click();}}>Change profile picture</button>
                <a class="bt2" href="#/user">Change user name</a>
        <input style="display:none" type="file" accept=".jpg, .jpeg, .png" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
        {#if $TWOFA == 'false'}
        <button on:click={TWOFAon} style="padding: 10px;width: 200px;color: white; background-color:lightslategrey;">Enable 2FA</button>
        {:else}
        <button on:click={TWOFAoff} style="padding: 10px; width: 200px; background-color: dimgrey; color: white">Disable 2FA</button>
        {/if}
    </div>
    <div class="tb1">
        <h1><span class="sp1">WINS   </span> <span class="sp2">     {$wins}</span></h1>
        <h1><span class="sp1">LOSSES   </span> <span class="sp2">       {$losses}</span></h1>
        <h1><span class="sp1">LEVEL   </span><span class="sp2">  {$level}</span></h1>
        <h1><span class="sp1">ID   </span><span class="sp2">  {$id}</span></h1>
    </div>
    <div>
        <h1 style="text-align: center">Your friends</h1>
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
        align-items: center; 
        display: block; 
        text-align:center;
    }
</style>