import io from 'socket.io-client';
import { SOCKET_IO_BACKEND } from './config';
import { ReplaySubject } from 'rxjs';
import { Message, WispData, WispPositionData } from './wisp-models';
import { PeerClient } from './peer-client';

export class WispClient {
  private socket: SocketIOClient.Socket;
  private peerClient: PeerClient;

  countWispsObs = new ReplaySubject<number>();

  constructor(
    peerClient: PeerClient,
    backendUrl = SOCKET_IO_BACKEND,
    connectCallback?: (self: WispClient) => void,
  ) {
    this.peerClient = peerClient;
    this.socket = io(backendUrl, { transports: ['websocket'] });
    this.setupWebSocketHandlers();

    this.socket.on('connect', async () => {
      console.log('my socket id is', this.socket.id);
      if (connectCallback) {
        connectCallback(this);
      }
    });
  }

  static create(backendUrl = SOCKET_IO_BACKEND): Promise<WispClient> {
    return new Promise(async (resolve, reject) => {
      const peerClient = await PeerClient.create();
      new WispClient(peerClient, backendUrl, resolve);
    });
  }

  close() {
    this.socket.close();
    this.countWispsObs.complete();
  }

  /** Rehosted stuff. */
  get messageObs() {
    return this.peerClient.messageObs;
  }

  broadcastMessage(message: string, options?: {}) {
    this.peerClient.peerBroadcast(message, options);
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
      new Message<WispData>('login', { peerId: this.peerClient.peerId }),
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
      if (wisp.peerId === this.peerClient.peerId) {
        return;
      }
      this.peerClient.peerConnect(wisp.peerId);
    });
  }

  private handleCountWisps(data: Message<number>) {
    const count = data.data;
    this.countWispsObs.next(count);
  }
}
