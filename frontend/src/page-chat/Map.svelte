<script lang="ts">
  import L from 'leaflet';
  import type { WispPositionData } from '../shared/wisp-models';

  export let position: WispPositionData;
  export let markers: WispPositionData[] = [];

  let map: L.Map;
  let mapMarkers: L.Marker[] = [];

  $: resetMapView(map, position);
  $: setMarkers(map, markers);

  function setMarkers(map: L.Map, markers: WispPositionData[]) {
    mapMarkers.forEach((mm) => mm.remove());
    mapMarkers = markers
      .filter((m) => !!m)
      .map((m) => L.marker([m.coords.latitude, m.coords.longitude]));
    mapMarkers.forEach((mm) => mm.addTo(map));
  }

  function resetMapView(map: L.Map, position?: WispPositionData) {
    const latitude = position?.coords?.latitude || 0;
    const longitude = position?.coords?.longitude || 0;
    map?.setView([latitude, longitude], 10);
  }

  function createMap(container: HTMLElement) {
    const created = L.map(container, {
      preferCanvas: true,
      maxBounds: new L.LatLngBounds([90, -180], [-90, 180]),
    });
    // resetMapView(created);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: `
        &copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,
          &copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`,
      subdomains: 'abcd',
      maxZoom: 14,
      minZoom: 2,
    }).addTo(created);
    return created;
  }

  function actionMap(container: HTMLElement) {
    map = createMap(container);
    return {
      destroy: () => {
        map.remove();
        map = null;
      },
    };
  }

  function resizeMap() {
    map?.invalidateSize();
  }
</script>

<style lang="scss">
  .map-container {
    width: 100%;
    height: 100%;
  }
</style>

<svelte:window on:resize={resizeMap} />
<svelte:head>
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
    integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
    crossorigin="" />
  <!-- Ensures that popup is fully stylable. -->
  <style>
    .custom-leaflet-popup > .leaflet-popup-content-wrapper {
      background-color: rgba(0, 0, 0, 0);
      box-shadow: none;
    }
    .custom-leaflet-popup > .leaflet-popup-tip-container > .leaflet-popup-tip {
      display: none;
    }
  </style>
</svelte:head>

<div class="map-container" use:actionMap />
