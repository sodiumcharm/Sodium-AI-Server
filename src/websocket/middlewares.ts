import { config } from '../config/config';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { AuthenticatedSocket } from '../types/types';

const authorizeUser = function (socket: AuthenticatedSocket, next: (err?: Error) => void): void {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    const authHeader = socket.handshake.headers.authorization;

    let token: string | null = null;

    if (cookieHeader) {
      const parsed = cookie.parse(cookieHeader);
      token = parsed.accessToken || null;
    }

    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new Error('Authorization token missing!'));
    }

    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as jwt.JwtPayload;

    socket.user = decoded;

    next();
  } catch (error) {
    return next(new Error('Invalid or expired token!'));
  }
};

export default authorizeUser;
