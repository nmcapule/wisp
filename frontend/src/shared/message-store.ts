import type { WispMessage } from './wisp-models';

import hash from 'object-hash';

export class MessageStore {
  private messageHashes = new Set<string>();

  hasOrAdd(message: WispMessage) {
    const h = hash(message);
    if (this.messageHashes.has(h)) {
      return true;
    }
    this.messageHashes.add(h);
    return false;
  }

  has(message: WispMessage) {
    return this.messageHashes.has(hash(message));
  }

  add(message: WispMessage) {
    return this.messageHashes.add(hash(message));
  }

  clear() {
    this.messageHashes.clear();
  }
}
