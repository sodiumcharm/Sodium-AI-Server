import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AsyncRouteHandler } from '../types/types';

const asyncHandler = function (callback: AsyncRouteHandler): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction) {
    callback(req, res, next).catch(next);
  };
};

export default asyncHandler;
