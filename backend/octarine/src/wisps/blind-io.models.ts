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
