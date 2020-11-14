import io from 'socket.io-client';
import { SOCKET_IO_BACKEND } from './config';
import type Peer from 'peerjs';
import { ReplaySubject } from 'rxjs';

export interface WispData {
  userId?: string;
  peerId?: string;
}

export interface WispPositionData {
  coords: {
    latitude?: number;
    longitude?: number;
  };
  scope: number;
}

export type MessageType =
  | 'login'
  | 'logout'
  | 'error'
  | 'scout'
  | 'wisps'
  | 'peer_message'
  | 'peer_heartbeat';

export class Message<T> {
  constructor(public type: MessageType, public data?: T) {}
}

export class WispClient {
  private socket: SocketIOClient.Socket;
  private peer: Peer;

  /** Connection lookup where key = peer id and value is data connection to the peer. */
  private connectionLookup: { [key: string]: Peer.DataConnection } = {};

  countWispsObs = new ReplaySubject<number>();
  connectionsObs = new ReplaySubject<{ [key: string]: Peer.DataConnection }>();

  constructor(backendUrl = SOCKET_IO_BACKEND, connectCallback?: (self: WispClient) => void) {
    this.peer = new (window as any).Peer(null, {
      host: 'localhost',
      port: 9000,
      path: '/peerjs',
      config: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        sdpSemantics: 'unified-plan',
      },
    }); // HAYUP
    this.setupPeerHandlers();
    this.socket = io(backendUrl, { transports: ['websocket'] });
    this.setupWebSocketHandlers();

    const peerPromise = new Promise((resolve, reject) => {
      this.peer.on('open', () => {
        console.log('my peer id is', this.peer.id);
        resolve(this.peer);
      });
    });

    const socketPromise = new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('my socket id is', this.socket.id);
        resolve(this.socket);
      });
    });

    Promise.all([peerPromise, socketPromise]).then(() => {
      if (connectCallback) {
        connectCallback(this);
      }
    });
  }

  static create(backendUrl = SOCKET_IO_BACKEND): Promise<WispClient> {
    return new Promise((resolve, reject) => {
      new WispClient(backendUrl, resolve);
    });
  }

  close() {
    this.socket.close();
    this.peer.destroy();

    this.countWispsObs.complete();
    this.connectionsObs.complete();
  }

  private setupWebSocketHandlers() {
    this.socket.on('message', (data: Message<any>) => {
      switch (data.type) {
        case 'login':
          this.handleMessageLogin(data);
          break;
        case 'logout':
          this.handleMessageLogout(data);
          break;
        case 'scout':
          this.handleMessageScout(data);
          break;
        case 'wisps':
          this.handleCountWisps(data);
          break;
        case 'error':
          console.error(data);
          break;
        default:
          console.error(`unknown data type: ${data.type}`);
      }
    });
  }

  login(position: WispPositionData) {
    this.socket.send(
      new Message<WispData>('login', { peerId: this.peer.id }),
    );
    this.scout(position);
  }

  logout() {
    this.socket.send(new Message<any>('logout'));
  }

  scout(position: WispPositionData) {
    this.socket.send(new Message<WispPositionData>('scout', position));
  }

  countWisps() {
    this.socket.send(new Message<void>('wisps'));
  }

  private handleMessageLogin(data: Message<any>) {
    console.log('login', data);
  }

  private handleMessageLogout(data: Message<any>) {
    console.log('logout', data);
  }

  private handleMessageScout(data: Message<WispData[]>) {
    data.data.forEach((wisp) => {
      if (wisp.peerId === this.peer.id) {
        return;
      }
      this.peerConnect(wisp.peerId);
    });
  }

  private handleCountWisps(data: Message<number>) {
    const count = data.data;
    this.countWispsObs.next(count);
  }

  private setupPeerHandlers() {
    this.peer.on('connection', (conn) => {
      this.connectionLookup[conn.peer] = conn;
      this.connectionsObs.next(this.connectionLookup);
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
    });
  }

  peerConnect(peerId: string) {
    const conn = this.peer.connect(peerId);
    this.connectionLookup[peerId] = conn;
    this.connectionsObs.next(this.connectionLookup);
    conn.on('open', () => {
      this.peerMessage(peerId, `ola dora from ${this.peer.id}`);
    });
  }

  peerDisconnect(peerId: string) {
    const conn = this.connectionLookup[peerId];
    conn.close();

    delete this.connectionLookup[peerId];
    this.connectionsObs.next(this.connectionLookup);
  }

  peerMessage(peerId: string, message: string) {
    this.connectionLookup[peerId].send(new Message<string>('peer_message', message));
  }

  private handlePeerMessage(data: Message<string>) {
    console.log('got message:', data.data);
  }
}
