<script lang='ts'>
    import { onMount } from 'svelte';
    import { level, logged, losses, username, wins, image_url, firstname, lastname, id, TWOFA, cookie, email, ownmail} from '../stores.js';

    let fileinput: any;
    let newImage: any;

    async function TWOFAon() 
    {
        if ($TWOFA == 'false')
        {
            // await fetch('http://localhost:3000/users/twofa', {
            //     method: "POST",
            //     headers:
            //     {
            //         'Authorization' : 'Bearer ' + $cookie,
            //     }
            // });
            // TWOFA.update(n => 'true');
            // alert("✅ Two factor authentification has been enalbled on this account");
            redirect('#/usermail');
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


function redirect(arg0: string) {
throw new Error('Function not implemented.');
}
</script>


<main>
    {#if $logged == 'true'}
    <div style="margin: 0 auto; display: block">
        <h1 class="name" style="color:darkred">{$username}</h1>
        <img class="profile" src={$image_url} width="200px" alt="Default Profile" /> 
        <a class="bt2" href="#/user">Change user name</a>
    </div>
    <div>
        <p style="text-align:center; color:grey; font-weight:500; font-style: italic">{$firstname} {$lastname}<br>{$email}</p>
    </div>
    <div style="margin: 0 auto; ">
                <button class="bt1" on:click={()=>{fileinput.click();}}>Change profile picture</button>
        <input style="display:none" type="file" accept=".jpg, .jpeg, .png" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
        {#if $TWOFA == 'false' && $ownmail == 'true'}
        <button on:click={TWOFAon} class="TWOFA" href="#/usermail" style=" margin: 0 auto;padding: 10px;width: 200px;color: white; background-color:lightslategrey;border-radius: 5px">Enable 2FA</button>
        {:else if $TWOFA == 'false'}
        <a class="TWOFA" href="#/usermail" style=" margin: 0 auto;padding: 10px;width: 200px;color: white; background-color:lightslategrey;border-radius: 5px">Enable 2FA</a>
        {:else}
        <button on:click={TWOFAoff} class="TWOFA" style=" margin: 0 auto;padding: 10px; width: 200px; background-color: dimgrey; color: white; border-radius:5px;">Disable 2FA</button>
        {/if}
    </div>
    <div class="tb1">
        <h1 style="width: 400px;background-color: darkgrey; color:white;text-decoration-line: underline;text-underline-offset: 20px;" >SCORES</h1>
        <h1><span class="sp1">wins</span> <span class="sp2">     {$wins}</span><span class="sp1">&emsp;&emsp;&emsp;losses</span> <span class="sp2">{$losses}</span><span class="sp1">&emsp;&emsp;&emsp;level</span><span class="sp2">  {$level}</span></h1>
        <!-- <h1><span class="sp1">ID   </span><span class="sp2">  {$id}</span></h1> -->
    </div>
    <div style="width: 400px;margin: 0 auto; display: block">
        <h1 style="background-color: darkgrey; color:white; text-align:center;">MATCH HISTORY</h1>
    </div>
    <div style="width:400px; margin: 0 auto; display: block;">
        <h1 style="background-color: darkgrey; color:white; text-align:center;">FRIENDS</h1>
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
    h1 {
        font-weight: 700;
        font-size: 30px;
    }
    .profile {
        margin: 0 auto;
        margin-top: 30px;
        display: block;
        align-items: center;
        align-content: center;
        border-radius: 50%;
        border: solid 10px darkgrey;
    }
    .name {
        text-align: center;
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        font-size: 3rem;
    }

    .tb1 {
        margin: 0 auto;
        margin-top: 30px;
        display: block;
        text-align: center;
        align-items: center;
    } 
    .sp1{
        font-weight: 700;
        font-size: 2rem;
    }
    .sp2 {
        font-weight: 200;
        font-size: 2rem;;
    }
    .bt1 {
        margin: 0 auto;
        align-items: center;
        min-width: 200px;
        text-align: center;
        border-radius: 5px;
        /* display: block; */
        background-color: rgb(224, 62, 62);
        color: white;
        padding: 10px;
        transition: transform .1s;
    
    }
    .bt1:hover {
        transform: scale(1.05); 
    }
     .bt2 {
        margin: 0 auto;
        align-items: center;
        width: 150px;
        font-weight: 500;
        /* background-color: rgb(2, 84, 131); */
        text-decoration: underline solid 2px;
        border-radius: 5px;
        color: rgb(2, 84, 131);
        /* padding: 10px; */
        align-items: center; 
        display: block; 
        text-align:center;
        transition: transform .1s;
    }
    .bt2:hover {
        transform: scale(1.05); 
    }
    .TWOFA {
        transition: transform .1s;
    }
    .TWOFA:hover {
        transform: scale(1.05); 
    }

</style>