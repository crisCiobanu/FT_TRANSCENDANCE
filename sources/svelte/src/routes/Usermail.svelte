<script>
    import { level, logged, losses, username, wins, image_url, firstname, lastname, id, cookie, TWOFA, ownmail, email } from '../stores.js';
    let mail;

    async function changeMailAddress() 
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
            await fetch("http://localhost:3000/users/updatemail/", {
            method: 'POST',

            body: JSON.stringify({"id": $id, "email": mail}),
            headers: 
            {
            'Authorization': 'Bearer ' + $cookie,
            "Content-type": "application/json; charset=UTF-8"
          },
        }); 
        console.log({$mail});
        ownmail.update(n =>'true');
        TWOFA.update(n => 'true');
        email.update(n => mail);
        alert("✅ Two factor authentification has been enalbled on this account");
      redirect("#/profile");
        }
        else
        {
            alert("❌ Two factor authentication is already enabled!");
            redirect("#/profile");
        }
    }

  </script>
  
  <main>
    <h2>Enter a private mail address</h2>
    <div>
      <input style="width: 150px;" aria-label="Mail address" bind:value={mail} />
      <div>
      <a href="#/profile" on:click={changeMailAddress} type="submit" value="Submit">Submit</a>
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
          padding:5px;
        }
        a {
          text-decoration-skip: true;
        }
      
  
  </style>