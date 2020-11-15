import type Peer from 'peerjs';
import { ReplaySubject } from 'rxjs';
import hash from 'object-hash';

import { PEERJS_BACKEND_HOST, PEERJS_BACKEND_PORT } from './config';
import { MessageStore } from './message-store';
import { Message, WispData, WispMessage } from './wisp-models';

export interface PeerClientOptions {
  host?: string;
  port?: string;
  pinned?: WispData[];
}

export class PeerClient {
  private peer: Peer;
  private messages = new MessageStore();
  private pinned: { [key: string]: WispData } = {};

  /** Connection lookup where key = peer id and value is data connection to the peer. */
  private connectionLookup: { [key: string]: Peer.DataConnection } = {};
  connectionsObs = new ReplaySubject<{ [key: string]: Peer.DataConnection }>();

  /** Everytime there's a new message, emit me. */
  messageObs = new ReplaySubject<WispMessage>();

  /** Everytime pinned changes, emit me. */
  pinnedObs = new ReplaySubject<{ [key: string]: WispData }>();

  constructor(options?: PeerClientOptions, connectCallback?: (self: PeerClient) => void) {
    this.peer = new (window as any).Peer(null, {
      host: options.host,
      port: options.port,
      path: '/peerjs',
      config: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        sdpSemantics: 'unified-plan',
      },
    }); // HAYUP

    this.peer.on('connection', (conn) => {
      this.connectionLookup[conn.peer] = conn;
      this.connectionsObs.next(this.connectionLookup);
      this.setupPeerHandlers(conn.peer, conn);
    });

    this.peer.on('open', () => {
      console.log('my peer id is', this.peer.id);
      connectCallback(this);
    });
  }

  static create(options: PeerClientOptions = {}): Promise<PeerClient> {
    options.host = options?.host || PEERJS_BACKEND_HOST;
    options.port = options?.port || PEERJS_BACKEND_PORT;

    return new Promise((resolve, reject) => {
      new PeerClient(options, resolve);
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

  private setupPeerHandlers(peerId: string, conn: Peer.DataConnection) {
    conn.on('open', () => {
      if (Math.random() > 0.9) {
        console.log('oops... sorry I shouted');

        this.peerMessage(peerId, `OLA DORA!!!`, { whisper: false });
      } else {
        this.peerMessage(peerId, `ola dora`, { whisper: true });
      }
    });
    conn.on('close', () => {
      console.warn('disconnected from', peerId);
      this.peerDisconnect(peerId);
    });
    conn.on('error', (e) => {
      console.warn('p2p connection error from', peerId, ':', e);
    });
    conn.on('data', (data: Message<any>) => {
      switch (data.type) {
        case 'peer_message':
          this.handlePeerMessage(data);
          break;
        case 'peer_heartbeat':
          // Still needed?
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
    this.connectionLookup[peerId] = conn;
    this.connectionsObs.next(this.connectionLookup);

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
  }

  peerBroadcast(message: string, options?: {}) {
    const wispMessage = this.createWispMessage(message, options);
    Object.entries(this.connectionLookup).forEach(([peerId, conn]) => {
      if (this.peerId === peerId) {
        return;
      }
      conn.send(new Message<WispMessage>('peer_message', wispMessage));
    });
  }

  private handlePeerMessage(data: Message<WispMessage>) {
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
    });
  }
}
