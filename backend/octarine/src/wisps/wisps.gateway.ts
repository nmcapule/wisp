import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(null, { transports: ['websocket'] })
export class WispsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message')
  onMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    console.log(data);
  }
}
