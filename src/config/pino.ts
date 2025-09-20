import { Request, Response } from 'express';
import pinoHttp, { Options } from 'pino-http';
import logger from '../utils/logger';

const pinoHttpOption: Options = {
  logger,
  serializers: {
    req(req: Request) {
      return { method: req.method, url: req.url, userAgent: req.headers['user-agent'] };
    },
    res(res: Response) {
      return { statusCode: res.statusCode };
    },
  },
  autoLogging: true,
  customSuccessMessage: function (req, res) {
    return `Request ${req.method} ${req.url} responded with status ${res.statusCode}`;
  },
  customErrorMessage: function (req, res, err) {
    return `Request ${req.method} ${req.url} responded with error ${err.message}`;
  },
};

const httpLogger = pinoHttp(pinoHttpOption);

export default httpLogger;
