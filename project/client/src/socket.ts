import { io, type Socket } from 'socket.io-client';
import { api } from './api';

let socket: Socket | null = null;

export function connectSocket(userId?: string) {
  if (socket) {
    if (userId) socket.emit('identify', userId);
    return socket;
  }
  const base = api.BASE || (import.meta.env.VITE_API_URL || 'http://localhost:5000');
  socket = io(base, { withCredentials: true, transports: ['websocket'] });
  socket.on('connect', () => {
    if (userId) socket?.emit('identify', userId);
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch (e) {
    // ignore
  }
  socket = null;
}
