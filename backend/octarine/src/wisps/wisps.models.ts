export type MessageType = 'login' | 'logout' | 'error' | 'scout' | 'wisps';

export class Message<T> {
  constructor(public type: MessageType, public data?: T) {}
}
