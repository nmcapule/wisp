import type Peer from 'peerjs';
import { ReplaySubject } from 'rxjs';
import hash from 'object-hash';

import { PEERJS_BACKEND_HOST, PEERJS_BACKEND_PORT } from './config';
import { MessageStore } from './message-store';
import { Message, WispData, WispMessage } from './wisp-models';
import type { GeoClient } from './geo-client';

export interface PeerClientOptions {
  host?: string;
  port?: string;
  pinned?: WispData[];
}

export const PEER_PING_TIMEOUT_MS = 5000;

export class PeerConnection {
  lastMessageTimestamp: number;
  dataConnection: Peer.DataConnection;
  dataConnectionOpened = false;

  constructor(conn: Peer.DataConnection) {
    this.lastMessageTimestamp = new Date().getTime();
    this.dataConnection = conn;
  }

  send(data: any) {
    this.dataConnection.send(data);
  }

  close() {
    this.dataConnection.close();
  }
}

export class PeerClient {
  private geoClient: GeoClient;

  private peer: Peer;
  private messages = new MessageStore();
  private pinned: { [key: string]: WispData } = {};

  /** Connection lookup where key = peer id and value is data connection to the peer. */
  private connectionLookup: { [key: string]: PeerConnection } = {};
  connectionsObs = new ReplaySubject<{ [key: string]: PeerConnection }>();

  /** Everytime there's a new message, emit me. */
  messageObs = new ReplaySubject<WispMessage>();

  /** Everytime pinned changes, emit me. */
  pinnedObs = new ReplaySubject<{ [key: string]: WispData }>();

  constructor(
    geoClient: GeoClient,
    options?: PeerClientOptions,
    connectCallback?: (self: PeerClient) => void,
  ) {
    this.geoClient = geoClient;
    this.peer = new (window as any).Peer(null, {
      host: options.host,
      port: options.port,
      path: '/peerjs',
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // { urls: 'stun:stun1.l.google.com:19302' },
          // { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' },
        ],
        sdpSemantics: 'unified-plan',
        // iceTransportPolicy: 'relay',
      },
    }); // HAYUP

    this.peer.on('connection', (conn) => {
      this.setupPeerHandlers(conn.peer, conn);
    });

    this.peer.on('open', () => {
      console.log('my peer id is', this.peer.id);
      connectCallback(this);
    });
  }

  static create(geoClient: GeoClient, options: PeerClientOptions = {}): Promise<PeerClient> {
    options.host = options?.host || PEERJS_BACKEND_HOST;
    options.port = options?.port || PEERJS_BACKEND_PORT;

    return new Promise((resolve, reject) => {
      new PeerClient(geoClient, options, resolve);
    });
  }

  close() {
    this.peer.destroy();
    this.connectionsObs.complete();
    this.messageObs.complete();
    this.pinnedObs.complete();
  }

  addToPinned(...wisps: WispData[]) {
    wisps.forEach((wisp) => {
      this.pinned[hash(wisp)] = wisp;
    });
    this.pinnedObs.next(this.pinned);
  }

  removeFromPinned(...wisps: WispData[]) {
    wisps.forEach((wisp) => {
      delete this.pinned[hash(wisp)];
    });
    this.pinnedObs.next(this.pinned);
  }

  replaceConnections(...wisps: WispData[]) {
    const legacyPeerIds = new Set<string>(Object.keys(this.connectionLookup));

    // After this procedure, ids that are left in legacyPeerIds should be disconnected.
    wisps.forEach((wisp) => {
      if (legacyPeerIds.has(wisp.peerId)) {
        legacyPeerIds.delete(wisp.peerId);
        return;
      }
      this.peerConnect(wisp.peerId);
    });

    legacyPeerIds.forEach((peerId) => {
      this.peerDisconnect(peerId);
    });
  }

  private setupPeerHandlers(peerId: string, conn: Peer.DataConnection) {
    conn.on('open', () => {
      this.connectionLookup[conn.peer] = new PeerConnection(conn);
      this.connectionLookup[peerId].dataConnectionOpened = true;
      this.connectionsObs.next(this.connectionLookup);

      if (Math.random() > 0.9) {
        console.log('oops... sorry I shouted');

        this.peerMessage(peerId, `OLA DORA!!!`, { whisper: false });
      } else {
        this.peerMessage(peerId, `heya welcome to the club!`, { whisper: true });
      }
    });
    conn.on('close', () => {
      console.warn('connection closed from', peerId);
      this.peerDisconnect(peerId);
    });
    conn.on('disconnected', () => {
      console.warn('disconnected from', peerId);
      this.peerDisconnect(peerId);
    });
    conn.on('error', (e) => {
      console.warn('p2p connection error from', peerId, ':', e);
    });
    conn.on('data', (data: Message<any>) => {
      // Refresh last message timestamp whenever getting a new message.
      this.connectionLookup[peerId].lastMessageTimestamp = new Date().getTime();
      this.connectionsObs.next(this.connectionLookup);

      switch (data.type) {
        case 'peer_message':
          this.handlePeerMessage(conn, data);
          break;
        case 'peer_ping':
          this.handlePing(conn, data);
          break;
        case 'peer_pong':
          break;
        default:
          console.error(`unknown p2p data type: ${data.type}`);
      }
    });
  }

  get peerId(): string {
    return this.peer.id;
  }

  peerConnect(peerId: string) {
    const conn = this.peer.connect(peerId);
    this.setupPeerHandlers(peerId, conn);
  }

  peerDisconnect(peerId: string) {
    const conn = this.connectionLookup[peerId];
    conn?.close();

    delete this.connectionLookup[peerId];
    this.connectionsObs.next(this.connectionLookup);
  }

  private createWispMessage(message: string, options: {}): WispMessage {
    const raw = {
      timestamp: new Date().getTime(),
      message,
      sourceWisp: { peerId: this.peerId },
      sourcePosition: {
        coords: this.geoClient.cache,
        scope: 3,
      },
      options,
    };
    const wispMessage: WispMessage = {
      ...raw,
      signature: hash(raw),
    };
    return wispMessage;
  }

  peerMessage(peerId: string, message: string, options?: {}) {
    const wispMessage = this.createWispMessage(message, options);
    const conn = this.connectionLookup[peerId];

    conn.send(new Message<WispMessage>('peer_message', wispMessage));
    this.peerPing(peerId);
  }

  peerBroadcast(message: string, options?: {}) {
    const wispMessage = this.createWispMessage(message, options);
    Object.entries(this.connectionLookup).forEach(([peerId, conn]) => {
      if (this.peerId === peerId) {
        return;
      }
      conn.send(new Message<WispMessage>('peer_message', wispMessage));
      this.peerPing(peerId);
    });
  }

  /**
   * Checks if peer is still alive. If not, then disconnect.
   * TODO: This doesn't work! Re-check please.
   */
  peerPing(peerId: string) {
    const conn = this.connectionLookup[peerId];
    if (!conn) {
      this.peerDisconnect(peerId);
      return;
    }

    conn.send(new Message<any>('peer_ping'));
    setTimeout(() => {
      const lastMessageTimestamp = this.connectionLookup[peerId]?.lastMessageTimestamp;
      if (!lastMessageTimestamp) {
        return;
      }

      const currentTimestamp = new Date().getTime();
      const diffMs = currentTimestamp - lastMessageTimestamp;
      if (diffMs < PEER_PING_TIMEOUT_MS * 2) {
        console.debug(`${peerId} last seen ${diffMs / 1000} seconds ago`);
        return;
      }

      this.peerDisconnect(peerId);
    }, PEER_PING_TIMEOUT_MS);
  }

  private handlePeerMessage(conn: Peer.DataConnection, data: Message<WispMessage>) {
    // Ignore if already been seen before.
    if (this.messages.hasOrAdd(data.data)) {
      console.warn('chucked previously seen message:', data.data.signature);
      return;
    }

    // Display to UI or emit to listeners.
    this.messageObs.next(data.data);

    // If message is a whisper, do not rebroadcast.
    if (data.data?.options?.whisper) {
      return;
    }

    // Rebroadcast to peers.
    Object.entries(this.connectionLookup).forEach(([peerId, conn]) => {
      // DO not rebroadcast to self of course.
      if (this.peerId === peerId) {
        return;
      }
      // DO not rebroadcast to the source.
      if (data.data.sourceWisp.peerId === peerId) {
        return;
      }
      console.debug('rebroadcast to', peerId);
      conn.send(new Message<WispMessage>('peer_message', data.data));
      this.peerPing(peerId);
    });
  }

  private handlePing(conn: Peer.DataConnection, data: Message<any>) {
    conn.send(new Message<WispMessage>('peer_pong'));
  }
}
