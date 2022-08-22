<script>

import { currentPage } from "../stores";
    import { onMount } from 'svelte';
    onMount(() => {
        currentPage.update(n => '');
    })
</script>

<section>
    <div>
        <h1>Page Not Found</h1>
        <p>ERROR 404</p>
    </div>
    <div>
       <a href="#/">🔙</a>
    </div>
</section>

<style>
    section {
        margin-top: 100px;
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        text-align: center;
        color: black;
    }
    h1 {
        font-size: 3rem;
        color: balck;
        font-weight: 900;
    }
    a {
        color: black;
        font-size: 3rem;
    }

</style>