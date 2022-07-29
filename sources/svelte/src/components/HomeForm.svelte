<script>
    let email = "";
    const handleInput = (e) => {
      email = e.target.value;
    };
  </script>


<div class="all">

    <form>

<!-- <form on:submit|preventDefault={handleSubmit}> -->
    <div>
        <input type="text" class="email" placeholder="Change username">
    </div>

    <!-- <button class="btn btn-full" on:click={() => submitted = true}>Continue</button>  -->
    <button class="btn">Submit modification</button>
</form>
</div>

<style>
/*  */
    .all {
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    }
    /* .pass {
        text-align: center;
        padding: 10px;
        /* margin: 0 auto; 
        border-radius: 0;
        margin: 0 auto; 
        align-items:center; 
        display:block;
        margin-bottom: 10px;
    } */
    .email {
        text-align: center;
        /* margin: 0 auto; */
  
        margin: 0 auto; 
        border-radius: 0;
        align-items:center; 
        display:block;
        margin-bottom: 10px;
        padding: 10px;
    }
    .btn {
    text-align: center;
    /* margin: 0 auto; */
    color: rgb(0, 0, 0);
    margin: 0 auto; 
    border: none;
    align-items:center; 
    display:block;
    padding: 10px;
    border-radius: 0;
    background-color: rgb(233, 233, 233);
    }
</style>