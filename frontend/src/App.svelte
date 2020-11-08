<script lang="ts">
  import { Router, links, Route } from 'svelte-routing';

  import RtcChat from './page-rtc-chat/RtcChat.svelte';
  import Chat from './page-chat/Chat.svelte';

  export let url = '';
</script>

<style lang="scss">
  @import './styles/theme.scss';

  .main-container {
    width: 100%;
    height: 100%;

    > .nav {
      width: 4em;
      background-color: var(--color-primary);

      > .item {
        width: 4em;
        height: 4em;
        background-color: var(--color-smoke);
        color: var(--color-silver);

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;

        > .nav-text {
          font-size: 0.8em;
        }

        &.-home {
          background-color: var(--color-primary);
          color: rgba(0, 0, 0, 0);
        }

        &.-selected {
          background-color: var(--color-white);
          color: var(--color-primary);
          font-weight: 600;
        }
      }
    }
  }
</style>

<Router {url}>
  <div class="d-flex main-container">
    <nav use:links class="nav d-flex flex-column">
      <a href="/" class="item -home"><span class="nav-text">Home</span></a>
      <a href="/chat" class="item -selected"><span class="nav-text">Chat</span></a>
      <a href="/rtc-chat" class="item"><span class="nav-text">RTC</span></a>
      <a href="/peers" class="item"><span class="nav-text">Peers</span></a>
      <a href="/public" class="item"><span class="nav-text">Public</span></a>
      <a href="/profile" class="item"><span class="nav-text">Profile</span></a>
    </nav>
    <div class="content flex-grow-1 align-self-stretch">
      <Route path="/chat" component={Chat} />
      <Route path="/rtc-chat" component={RtcChat} />
    </div>
  </div>
</Router>
