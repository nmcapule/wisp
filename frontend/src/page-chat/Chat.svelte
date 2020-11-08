<script lang="ts">
  import Map from './Map.svelte';
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
</style>

<div class="wisp-page d-flex align-items-stretch">
  <div class="page-card d-flex flex-column">
    <div class="h2 font-weight-normal title">Hello ___________ !</div>
    <div class="peer-list d-flex flex-column">
      <div class="label">Pinned</div>
      <div class="item" />
      <div class="item" />
      <div class="item" />
    </div>
    <div class="peer-list d-flex flex-column">
      <div class="label">Peers</div>
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
      <div class="fab-button interactive d-flex justify-content-center align-items-center">
        <span class="icon">💬</span>
      </div>
    </div>
    <Map />
  </div>
</div>
