<script>
  import { level, logged, losses, username, wins, image_url, firstname, lastname } from '../stores.js';
  let user;
 async	function changeUserName() {
    username.update(n => user);

    //TODO: transfer to database;
    await fetch("http://localhost:3000/users/updateusername", {
      method: 'POST',
        headers: 
        {
         "Content-type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({"username": user, "id": id})
    }); 

    alert("Your username has beem changed to " + user)
    redirect("#/profile");
		console.log({user});
	}
</script>

<main>
  <h2>Enter new username</h2>
  <div>
    <input style="width: 150px;" aria-label="Enter new username" bind:value={user} />
    <div>
    <a href="#/profile" on:click={changeUserName} type="submit" value="Submit">Submit</a>
  </div>
  <div class="link">
  </div>
  <div class="link">
    <a href="#/profile" >🔙</a>
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
      .link {
        margin-top: 100px;
        margin: 0 auto;
        width: 50px;
        size: 200px;
        font-size: 50px;
        color: white;
        /* background-color: rgb(201, 65, 65); */
        /* border: 1px solid black; */
        padding:5px;
      }
      a {
        /* background-color: grey; */
        text-decoration-skip: true;
      }
    

</style>