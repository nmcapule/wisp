<script lang="ts">
  import { onMount } from 'svelte';

  import Map from './Map.svelte';
  import { WispClient } from '../shared/wisp-client';

  onMount(async () => {
    const wc = await WispClient.create();
    wc.login({
      coords: {
        longitude: Math.random() * 180,
        latitude: Math.random() * 180,
      },
      scope: 3,
    });
  });

  let showMessageDialog = false;
  let elemMessageInput;
  $: (() => {
    if (elemMessageInput) {
      elemMessageInput.focus();
    }
  })();

  function messageInputKeydown(event) {
    if (event.code === 'Enter' && !event.shiftKey) {
      showMessageDialog = false;
      sendMessage(elemMessageInput.value);
      return;
    }
    // TODO: This doesn't work. Escape is not captured.
    if (event.code === 'Escape') {
      showMessageDialog = false;
      return;
    }
  }

  function sendMessage(s: string) {
    alert(`send message: ${s}`);
  }
</script>

<style lang="scss">
  @import '../styles/theme.scss';

  .page-card {
    width: 25em;
    box-shadow: 0.25em 0px 0.25em var(--color-smoke);
    overflow-y: auto;

    > .title {
      margin: 0.15em 2em 0 0.5em;
      padding: 0.3em 0;
      border-bottom: 0.1em solid var(--color-smoke);
    }
  }

  .peer-list {
    margin: 1em 1em 0;

    > .label {
      font-size: 1.2em;
      margin-bottom: 0.5em;
      color: var(--color-silver);
    }

    > .item {
      height: 4em;
      background-color: var(--color-snow);
      margin: 0 0 0.5em;
    }
  }

  .name-input {
    border-bottom: 2px solid var(--color-smoke);
    min-width: 10em;
    cursor: pointer;
  }

  .online-indicator {
    background-color: var(--color-primary);
    color: var(--color-primary-text);
    padding: 0.5em 1em;
    margin: 1em;
    border-radius: 10em;
  }

  .fab-button {
    background-color: var(--color-primary);
    color: var(--color-primary-text);
    margin: 1em;
    width: 5em;
    height: 5em;
    border-radius: 10em;
    cursor: pointer;

    > .icon {
      font-size: 1.5em;
    }
  }

  .message-input {
    width: 30em;
    height: 20em;
    max-width: 100%;
    max-height: 100%;
    border: 0;
    border-radius: 0.75em;
    font-size: 1.5em;
  }
</style>

<div class="wisp-page d-flex align-items-stretch">
  <div class="page-card d-flex flex-column">
    <div class="h2 font-weight-normal title">
      Hello
      <span contenteditable="true" class="name-input">user-12345</span>
      !
    </div>
    <div class="peer-list d-flex flex-column">
      <div class="label d-flex justify-content-between"><span>Pinned</span> <span>📌</span></div>
      <div class="item" />
      <div class="item" />
      <div class="item" />
    </div>
    <div class="peer-list d-flex flex-column">
      <div class="label d-flex justify-content-between"><span>Peers</span> <span>🤝</span></div>
      <div class="item" />
      <div class="item" />
      <div class="item" />
    </div>
  </div>
  <div class="page-content flex-grow-1 position-relative">
    <div class="wisp-overlay d-flex justify-content-end align-items-start">
      <div class="online-indicator interactive">396 wisps online @heywisp.io</div>
    </div>
    <div class="wisp-overlay d-flex justify-content-end align-items-end">
      <div
        class="fab-button interactive d-flex justify-content-center align-items-center"
        on:click={() => (showMessageDialog = true)}>
        <span class="icon">💬</span>
      </div>
    </div>
    {#if showMessageDialog}
      <div
        class="wisp-overlay wisp-dialog interactive d-flex justify-content-center align-items-center"
        on:click={() => (showMessageDialog = false)}>
        <textarea
          bind:this={elemMessageInput}
          class="message-input"
          placeholder="Input text here"
          on:click={(e) => e.stopPropagation()}
          on:keydown={messageInputKeydown} />
      </div>
    {/if}
    <Map />
  </div>
</div>
