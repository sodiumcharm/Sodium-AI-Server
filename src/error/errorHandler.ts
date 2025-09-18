import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';
import { config } from '../config/config';
import logger from '../utils/logger';

const sendErrorDev = (error: Error | ApiError, res: Response): void => {
  res.status('statusCode' in error ? error.statusCode : 500).json({
    status: 'status' in error ? error.status : 'error',
    message: error.message,
    error,
    stack: error.stack,
  });
};

const sendErrorProd = (error: Error | ApiError, res: Response): void => {
  if (error instanceof ApiError && error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    logger.error({ error: error });

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

const globalErrorHandler = function (
  err: ApiError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!(err instanceof ApiError)) {
    (err as any).statusCode = (err as any).statusCode || 500;
    (err as any).status = (err as any).status || 'error';
  }

  if (config.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (config.NODE_ENV === 'production') {
    sendErrorProd(err, res);
  }
};

export default globalErrorHandler;
