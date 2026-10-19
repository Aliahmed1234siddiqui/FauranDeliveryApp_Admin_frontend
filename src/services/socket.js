// Socket.IO connection for live events (handbook section 18).
// Admin sockets join the `admins` room automatically on the server.
//
// Events received:
//   rider:live_location  { riderId (_id), lat, lng, isAvailable }
//   rider:status         { riderId (_id), isOnline }
//   notification:new     notification object

import { useEffect, useLayoutEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { tokenStore } from './http';

let socket = null;

export function connectSocket() {
  const token = tokenStore.get();
  if (!token) return null;
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }
  // Serverless hosts (e.g. Vercel) don't keep sockets open, so give up after a few
  // tries instead of retrying forever. Pages that need live data also poll.
  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnectionAttempts: 5 });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

/** Subscribe to one socket event while the component is mounted. */
export function useSocketEvent(event, handler) {
  const ref = useRef(handler);
  useLayoutEffect(() => { ref.current = handler; });

  useEffect(() => {
    const s = connectSocket();
    if (!s) return undefined;
    const listener = (payload) => ref.current(payload);
    s.on(event, listener);
    return () => { s.off(event, listener); };
  }, [event]);
}
