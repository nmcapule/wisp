import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { WispPositionData, WispData } from './blind-io.models';

/**
 * Temporary service -- as a stopgap for implementing the Blind IO microservice.
 *
 * Rules of the game:
 *  - One WebSocket connection is exactly one wisp.
 *  - One wisp is exactly one peer connection (PeerJS) id.
 *  - One user can have multiple wisps.
 */
@Injectable()
export class BlindIoService {
  /** Redis client. */
  client = this.redis.getClient();

  constructor(private readonly redis: RedisService) {}

  async addWisp(socketId: string, data: WispData) {
    await this.client.sadd(`sockets::all`, socketId);
    return this.client.set(`socket::${socketId}`, JSON.stringify(data));
  }

  async removeWisp(socketId: string) {
    await this.client.srem(`sockets::all`, socketId);
    return this.client.del(`socket::${socketId}`);
  }

  async placeWisp(socketId: string, data: WispPositionData) {
    return this.client.set(`coords::${socketId}`, JSON.stringify(data));
  }

  async getWisp(socketId: string): Promise<WispData> {
    const s = await this.client.get(`socket::${socketId}`);
    return JSON.parse(s);
  }

  async getWispCoords(socketId: string): Promise<WispPositionData> {
    const s = await this.client.get(`coords::${socketId}`);
    return JSON.parse(s);
  }

  async findNearbyWisps(socketId: string, data: WispPositionData): Promise<WispData[]> {
    await this.placeWisp(socketId, data);

    // TODO: Use location-based sampling.
    const samples = await this.client.srandmember(`sockets::all`, 10);
    const usersJSON = await this.client.mget(...samples);

    return usersJSON.map((s) => JSON.parse(s));
  }
}
