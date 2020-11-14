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

export interface WispMessage<T = string> {
  timestamp: number;
  sourceWisp: WispData;
  sourcePosition?: WispPositionData;
  message: T;
  signature: string;
  options?: {
    whisper?: boolean;
  };
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
