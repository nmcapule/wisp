import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { WispPositionData, WispData } from './blind-io.models';
import { BlindIoService } from './blind-io.service';
import { Message } from './wisps.models';

@WebSocketGateway(null, { transports: ['websocket'] })
export class WispsGateway implements OnGatewayConnection<Socket>, OnGatewayDisconnect<Socket> {
  @WebSocketServer()
  server: Server;

  constructor(private readonly blindIoService: BlindIoService) {}

  @SubscribeMessage('message')
  onMessage(@ConnectedSocket() client: Socket, @MessageBody() message: Message<any>) {
    switch (message.type) {
      case 'login':
        this.handleLogin(client, message);
        break;
      case 'logout':
        this.handleLogout(client);
        break;
      case 'scout':
        this.handleScout(client, message);
        break;
      case 'wisps':
        this.handleCountWisps(client);
        break;
      default:
        client.send(new Message('error', `unknown message type: ${message.type}`));
    }
  }

  /** Override. Fires when a new client logs in. */
  async handleConnection(client: Socket) {
    // Generate anon user.
    const anon = { userId: uuidv4() };

    await this.blindIoService.addWisp(client.id, anon);
    this.handleCountWisps();
  }

  /** Override. Fires when an existing client logs out. */
  async handleDisconnect(client: Socket) {
    await this.blindIoService.removeWisp(client.id);
    this.handleCountWisps();
  }

  async handleLogin(client: Socket, message: Message<WispData>) {
    const current = await this.blindIoService.getWisp(client.id);

    await this.blindIoService.addWisp(client.id, {
      ...current,
      ...message.data,
    });

    client.send(new Message<WispData>('login', message.data));
  }

  async handleLogout(client: Socket) {
    // Generate anon user.
    const anon = { userId: uuidv4() };

    // Make an anonymous user associated to client id when logging out.
    await this.blindIoService.addWisp(client.id, anon);

    client.send(new Message<WispData>('logout', anon));
  }

  async handleScout(client: Socket, message: Message<WispPositionData>) {
    const users = await this.blindIoService.findNearbyWisps(client.id, message.data);
    client.send(new Message<WispData[]>('scout', users));
  }

  async handleCountWisps(client?: Socket) {
    const count = await this.blindIoService.countWisps();
    const response = new Message<number>('wisps', count);

    if (client) {
      client.send(response);
    } else {
      this.broadcast(response);
    }
  }

  async broadcast<T>(message: Message<T>) {
    this.server.sockets.send(message);
  }
}
