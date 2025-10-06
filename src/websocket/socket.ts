import { Server as SocketIOServer } from 'socket.io';
import authorizeUser from './middlewares';
import logger from '../utils/logger';
import { AuthenticatedSocket } from '../types/types';

export const onlineUsers = new Map<string, string>();

export const initSockets = function (io: SocketIOServer) {
  io.use(authorizeUser);

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?._id.toString();

    if (userId) {
      onlineUsers.set(userId, socket.id);
      logger.info(`User ${userId} connected with socket ${socket.id}.`);
    }

    socket.on('disconnect', () => {
      if (userId) {
        onlineUsers.delete(userId);
        logger.info(`User ${userId} disconnected from socket.`);
      }
    });
  });
};
