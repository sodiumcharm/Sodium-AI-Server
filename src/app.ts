import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import corsOptions from './config/cors';
import passport from './controllers/oauth/passport';
import { globalLimiter } from './config/expressRateLimit';
import httpLogger from './config/pino';
import { API_URL } from './constants';
import homeRouter from './routes/home.route';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import characterRouter from './routes/character.routes';
import globalErrorHandler from './error/errorHandler';

const app: Application = express();

app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(cookieParser());

app.use(express.static('public'));

app.use(helmet());

app.use(compression({ threshold: 1024 }));

app.use(globalLimiter);

app.use(passport.initialize());

app.use(httpLogger);

app.use(API_URL, homeRouter);

app.use(`${API_URL}/auth`, authRouter);

app.use(`${API_URL}/users`, userRouter);

app.use(`${API_URL}/characters`, characterRouter);

app.use(globalErrorHandler);

export default app;
