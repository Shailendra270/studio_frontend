import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => socket;

export const connectSocket = (opts?: { url?: string }) => {
  if (socket) return socket;
  const url = opts?.url || import.meta.env.VITE_SOCKET_URL || window.location.origin;
  socket = io(url, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    withCredentials: true,
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

