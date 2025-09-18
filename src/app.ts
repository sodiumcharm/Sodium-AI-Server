import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import corsOptions from './config/cors';
import limiter from './config/expressRateLimit';
import { API_URL } from './constants';
import homeRouter from './routes/home.route';
import globalErrorHandler from './error/errorHandler';

const app = express();

app.use(cors(corsOptions));

app.use(express.json({ limit: '16kb' }));

app.use(express.urlencoded({ extended: true, limit: '16kb' }));

app.use(cookieParser());

app.use(helmet());

app.use(compression({ threshold: 1024 }));

app.use(limiter);

app.use(express.static('public'));

app.use(API_URL, homeRouter);

app.use(globalErrorHandler);

export default app;
