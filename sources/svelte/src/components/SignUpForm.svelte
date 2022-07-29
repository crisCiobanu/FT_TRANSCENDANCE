<script>
    import { getUserDetails } from '../hooks/auth';
	import { store } from '../hooks/auth';
	let mail = '';
	let pass = '';
	let error = '';

	async function login() {
		console.log(A);
		const user = await getUserDetails( username, password )

		if ( user ) {
			console.log(user)
			$store = user
			if ( error ) error = ''
		}
		else {
			error = 'Incorrect username and password.'
			console.log("Incorrect username and password.")
		}

	};

	const handleInput = (e) => {
      mail = e.target.value;
    };
	// async function doPost () {
	// 	const res = await fetch('http://localhost:3000/signup', {
	// 		method: 'POST',
	// 		body: JSON.stringify({
	// 			mail,
	// 			pass
	// 		})
	// 	})
		
	// 	const json = await res.json();
	// 	console.log("A");
	// 	console.log(json);
	// }
</script>

<form>
    <div>
    <input type="email" class="email" placeholder="Mail address" on:input={handleInput} bind:value={mail} />
    </div> 
    <div>
    <input type="password" class="pass" placeholder="Password" required min="8" bind:value={pass} />
    </div> 
    <button class="btn" type="submit" on:submit|preventDefault={login}>
        Sign Up
    </button>
    <div id="error_message" class="text-danger">
        <small>{error}</small>
    </div>
    </form>

    <style>
        input {
          text-align: center;
        }
        button {
          border: none;
          background-color: rgb(184, 30, 30);
          color: white;
          border-radius: 0;
          padding: 10px;
        }
      
      </style>