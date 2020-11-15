export interface GeoCoords {
  longitude: number;
  latitude: number;
}

export class GeoClient {
  cache?: GeoCoords;
  cacheConfidence = 0;
  lastCacheTimestamp = 0;

  randomizer = 0.25;

  static create() {
    return new GeoClient();
  }

  async locate(noCache = false) {
    if (this.cache && !noCache) {
      return this.cache;
    }

    const vlat = Math.random() * this.randomizer - this.randomizer / 2;
    const vlng = Math.random() * this.randomizer - this.randomizer / 2;

    try {
      if (navigator?.geolocation) {
        // TODO: [Violation] Only request geolocation information in response to a user gesture.
        const position: any = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject),
        );
        if (position) {
          this.cache = {
            latitude: position.coords.latitude + vlat,
            longitude: position.coords.longitude + vlng,
          };
          this.cacheConfidence = 3;
          this.lastCacheTimestamp = new Date().getTime();
          return this.cache;
        }
      }
    } catch (e) {
      console.warn('geolocation failed. fallback to ip-based location.');
    }

    // Fallback to IP-based location if GeoLocation API is not successful.
    const response = await fetch(`http://www.geoplugin.net/json.gp?jsoncallback=?`);
    const text = await response.text();
    // Removes stray chars from geoplugin API.
    const geo = JSON.parse(text.slice(4, text.length - 1));

    const latitude = Number(geo['geoplugin_latitude']) + vlat;
    const longitude = Number(geo['geoplugin_longitude']) + vlng;

    this.cache = { latitude, longitude };
    this.cacheConfidence = 1;
    this.lastCacheTimestamp = new Date().getTime();

    return { latitude, longitude };
  }
}
