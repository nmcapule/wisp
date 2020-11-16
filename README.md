# Project Wisp

This is an experimental project for creating P2P connections through the browser
as much as possible, with minimal aid of a server. The goal is to setup voronoi-like
p2p connections that can create a low-cost global network mesh.

TURNs out it is harder than I thought. WebRTC has been around for more than 5 years
now and it only budged a little on the sliding scale of accessibility vs gate-keeped.

**Expectations**

- 1 frontend code with WebRTC
- 1 minimal discovery and signalling server
- 1 free STUN server provided by Google at `stun:stun.l.google.com:19302`

**Reality**

- 1 frontend code with PeerJS as a wrapper library to the mess that is the WebRTC API
- 1 signalling server (from PeerServer) -- which tbf, we could bake in the discovery server
  -- but it's oh so f-hard 🤣
- 1 discovery server (my business logic) that dictates which peer can discover which peer
- 1 free STUN server provided by Google ✔
- 1 coTURN server because outside of your own LAN, STUN and direct P2P from WebRTC will fail.
  I didn't even have the patience to set this up correctly. We have the option to rent TURN
  servers from **Twilio** or **Xirsys**, but that's an investment I don't want to take.

> **Status**: Fail. I'm going back to the traditional server-client architecture ☀

> **Status (the next morning)**: OK. I'm jumping in the TURN train. Xirsys has a free tier. Choo choo!

## Development

You need to `docker-compose`.

```sh
$ docker-compose up
```

The backend listens at localhost:3000 and localhost:3002.
The coTURN server listens at localhost:3478.
The frontend listens at localhost:5000 and localhost:35729 (for ws).

## Blockers

- PH to PH connections work on STUN and (my) TURN setup. I set up a SOCKS tunnel so that I
  could simulate SH to PH p2p connection and it failed miserably. Only SG to SG or PH to PH
  p2p connections work. Bummer.
- In other news, turns out you could have a semi-VPN by using a SOCKS tunnel! Pretty easy to
  [setup in Firefox too](https://linuxize.com/post/how-to-setup-ssh-socks-tunnel-for-private-browsing/#google-chrome).

## Promising Techs

- https://github.com/manubb/Leaflet.PixiOverlay
- Web Workers
- Indexed DB
