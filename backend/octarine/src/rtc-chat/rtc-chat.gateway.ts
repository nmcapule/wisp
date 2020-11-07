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

export interface Message {
  type: string;

  // Optionals.
  id?: any;
  username?: string;

  success?: boolean;
  message?: any;

  user?: Partial<User>;
  users?: Partial<User>[];

  offer?: any;
  answer?: any;
  candidate?: any;
}

export class User {
  constructor(public id: any, public username: string, public client?: Socket) {}

  send(message: Message) {
    this.client.send(message);
  }
}

@WebSocketGateway(null, { transports: ['websocket'] })
export class RtcChatGateway implements OnGatewayConnection<Socket>, OnGatewayDisconnect<Socket> {
  @WebSocketServer()
  server: Server;

  wsidToUsername: { [key: string]: string } = {};
  users: { [key: string]: User } = {};

  private sendToAll(accounts: { [key: string]: User }, type: string, sender?: User) {
    Object.values(accounts).forEach((account) => {
      console.log(account.username, sender?.username);
      if (account?.username === sender?.username) {
        return;
      }
      account.send({ type, user: { id: sender?.id, username: sender?.username } });
    });
  }

  handleConnection(client: Socket) {
    client.send({
      type: 'connect',
      message: 'Well hello there, I am a WebSocket server',
    });
  }

  handleDisconnect(client: Socket) {
    this.onLogout(client);
  }

  @SubscribeMessage('message')
  onMessage(@ConnectedSocket() client: Socket, @MessageBody() data: Message) {
    switch (data.type) {
      case 'login':
        this.onLogin(client, data);
        break;
      case 'leave':
      case 'logout':
        this.onLogout(client);
        break;
      case 'users':
        this.onUsers(client);
        break;
      case 'offer':
        this.onOffer(client, data);
        break;
      case 'answer':
        this.onAnswer(client, data);
        break;
      case 'candidate':
        this.onCandidate(client, data);
        break;
      default:
        client.send({
          type: 'error',
          message: `Command not found: ${data.type}`,
        });
    }
  }

  onLogin(client: Socket, data: Message) {
    if (data.username in this.users) {
      client.send({
        type: 'login',
        success: false,
        message: 'Username is unavailable',
      });
      return;
    }

    // Check first if id is already logged in.
    if (client.id in this.wsidToUsername) {
      const prev = this.wsidToUsername[client.id];
      this.onLogout(this.users[prev].client);
    }

    const activeUsers = Object.values(this.users).map((user) => ({
      id: user.id,
      username: user.username,
    }));

    const user = new User(client.id, data.username, client);
    client.send({
      type: 'login',
      success: true,
      users: activeUsers,
    });
    this.users[data.username] = user;
    this.wsidToUsername[client.id] = data.username;

    this.sendToAll(this.users, 'updateUsers', user);
  }

  onLogout(client: Socket) {
    const username = this.wsidToUsername[client.id];
    this.sendToAll(this.users, 'leave', this.users[username]);

    delete this.users[username];
    delete this.wsidToUsername[client.id];
  }

  onUsers(client: Socket) {
    client.send({
      type: 'users',
      users: Object.values(this.users).map((user) => ({
        id: user.id,
        username: user.username,
      })),
    });
  }

  onOffer(client: Socket, data: Message) {
    const offererUsername = this.wsidToUsername[client.id];
    const offerer = this.users[offererUsername];
    if (!offerer) {
      client.send({
        type: 'error',
        message: `Who the f are you ${offererUsername}?`,
      });
      return;
    }

    const recipient = this.users[data.username];
    if (!recipient) {
      client.send({
        type: 'error',
        message: `User ${data.username} does not exist!`,
      });
      return;
    }

    recipient.send({
      type: 'offer',
      offer: data.offer,
      user: {
        id: offerer.id,
        username: offerer.username,
      },
      username: offerer.username,
    });
  }

  onAnswer(client: Socket, data: Message) {
    const offerer = this.users[data.username];
    if (!offerer) {
      client.send({
        type: 'error',
        message: `User ${data.username} does not exist!`,
      });
      return;
    }

    offerer.send({
      type: 'answer',
      answer: data.answer,
      user: {
        id: offerer.id,
        username: offerer.username,
      },
    });
  }

  onCandidate(client: Socket, data: Message) {
    const recipient = this.users[data.username];
    if (!recipient) {
      client.send({
        type: 'error',
        message: `User ${data.username} does not exist!`,
      });
      return;
    }

    recipient.send({
      type: 'candidate',
      candidate: data.candidate,
      user: {
        id: this.users[this.wsidToUsername[client.id]].id,
        username: this.users[this.wsidToUsername[client.id]].username,
      },
    });
  }
}
