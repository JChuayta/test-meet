import { io, Socket } from 'socket.io-client';

const SERVER_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let signalingSocket: Socket | null = null;
let currentUserId: string | null = null;
let roomsSocket: Socket | null = null;
let roomsUserId: string | null = null;
let chatSocket: Socket | null = null;

export function getSocket(userId: string): Socket {
  if (signalingSocket && currentUserId !== userId) {
    signalingSocket.disconnect();
    signalingSocket = null;
    currentUserId = null;
  }

  if (!signalingSocket) {
    signalingSocket = io(`${SERVER_HOST}/signaling`, {
      auth: { userId },
      transports: ['websocket', 'polling'],
      upgrade: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    currentUserId = userId;
  }
  return signalingSocket;
}

export function getSignalingSocket(userId: string): Socket {
  return getSocket(userId);
}

export function getRoomsSocket(userId: string): Socket {
  if (roomsSocket && roomsUserId !== userId) {
    roomsSocket.disconnect();
    roomsSocket = null;
    roomsUserId = null;
  }

  if (!roomsSocket) {
    roomsSocket = io(`${SERVER_HOST}/rooms`, {
      auth: { userId },
      transports: ['websocket', 'polling'],
      upgrade: true,
      autoConnect: true,
      reconnection: true,
    });

    roomsUserId = userId;
  }
  return roomsSocket;
}

export function getChatSocket(userId: string): Socket {
  if (!chatSocket) {
    chatSocket = io(`${SERVER_HOST}/chat`, {
      auth: { userId },
      transports: ['websocket', 'polling'],
      upgrade: true,
    });
  }
  return chatSocket;
}

export function disconnectAll() {
  if (signalingSocket) signalingSocket.disconnect();
  if (roomsSocket) roomsSocket.disconnect();
  if (chatSocket) chatSocket.disconnect();
  signalingSocket = null;
  roomsSocket = null;
  chatSocket = null;
  currentUserId = null;
  roomsUserId = null;
}

export function disconnectSocket() {
  if (signalingSocket) {
    signalingSocket.disconnect();
    signalingSocket = null;
    currentUserId = null;
  }
}