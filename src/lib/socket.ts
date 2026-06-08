import { io, Socket } from 'socket.io-client';

// In development, Next.js page matches Node.js server.js host
const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});
