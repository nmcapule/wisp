<script lang="ts">
  import { Router, Link, Route } from 'svelte-routing';

  import RtcChat from './rtc-chat/RtcChat.svelte';

  export let url = '';
</script>

<style lang="scss">
  .nav-container {
    position: fixed;
    right: 0;
    z-index: 1000;
    background-color: #fff;
  }
  .main-container {
    width: 100%;
    height: 100%;
  }
</style>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
    integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
    crossorigin="anonymous" />
</svelte:head>

<Router {url}>
  <nav class="nav-container">
    <Link to="/chat">Chat</Link>
  </nav>
  <div class="main-container">
    <Route path="/chat">
      <RtcChat />
    </Route>
  </div>
</Router>
