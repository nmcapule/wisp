export interface WsUserData {
  userId?: string;
  peerId?: string;
}

export interface ScoutingData {
  coords: {
    latitude?: number;
    longitude?: number;
  };
  scope: number;
}
