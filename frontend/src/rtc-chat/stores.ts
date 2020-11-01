import { writable } from 'svelte/store';

export const inputText = writable('');

export const usersList = writable([]);

export const partnerUserRef = writable(null);
export const partnerMessagesRef = writable([]);

export const rtcConnection = writable<RTCPeerConnection>(null);
export const rtcChannel = writable<RTCDataChannel>(null);
