import { Router } from 'express';
import { Response } from 'express';

const router = Router();

router.route('/').get(function (req, res: Response) {
  res.status(200).json({
    message: 'Welcome to Sodium AI',
    version: '1.0.0',
    status: 'ok',
    ipAddress: req.ip?.replace(/^::ffff:/, '') || 'Unknown',
    timestamp: new Date().toISOString(),
  });
});

export default router;
