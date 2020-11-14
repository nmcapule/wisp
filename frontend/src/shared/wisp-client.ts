import io, { connect } from 'socket.io-client';
import { SOCKET_IO_BACKEND } from './config';

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

export type MessageType = 'login' | 'logout' | 'error' | 'scout';

export class Message<T> {
  constructor(public type: MessageType, public data?: T) {}
}

export class WispClient {
  socket: SocketIOClient.Socket;

  constructor(backendUrl = SOCKET_IO_BACKEND, connectCallback?: (self: WispClient) => void) {
    this.socket = io(backendUrl, { transports: ['websocket'] });
    this.setupEventHandlers(connectCallback);
  }

  static create(backendUrl = SOCKET_IO_BACKEND): Promise<WispClient> {
    return new Promise((resolve, reject) => {
      new WispClient(backendUrl, resolve);
    });
  }

  private setupEventHandlers(connectCallback?: (self: WispClient) => void) {
    this.socket.on('connect', () => {
      console.log("Whoops, hey you're connected!");

      if (connectCallback) {
        connectCallback(this);
      }
    });
    this.socket.on('message', (data) => {
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
      new Message<WispData>('login', { peerId: `${Math.random() * 10000}` }),
    );
    this.scout(position);
  }

  logout() {
    this.socket.send(new Message<any>('logout'));
  }

  scout(position: WispPositionData) {
    this.socket.send(new Message<WispPositionData>('scout', position));
  }

  handleMessageLogin(data: Message<any>) {
    console.log('login', data);
  }

  handleMessageLogout(data: Message<any>) {
    console.log('logout', data);
  }

  handleMessageScout(data: Message<any>) {
    console.log('scout', data);
  }

  close() {
    this.socket.close();
  }
}
