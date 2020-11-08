<script lang="ts">
  import Map from './Map.svelte';
</script>

<style lang="scss">
  @import '../styles/theme.scss';

  .page-card {
    width: 25em;
    box-shadow: 0.25em 0px 0.25em var(--color-smoke);

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
</style>

<div class="page-container d-flex align-items-stretch">
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
  <div class="page-content flex-grow-1">
    <Map />
  </div>
</div>
