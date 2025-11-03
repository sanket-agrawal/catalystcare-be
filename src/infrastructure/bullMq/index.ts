import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from '../../infrastructure/queues';
import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

const router = express.Router();

// 🛡️ Basic Auth Middleware
router.use((req : Request, res : Response, next : NextFunction) => {
  const auth = { login: process.env.BULL_BOARD_USER, password: process.env.BULL_BOARD_PASS };

  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  if (login && password && login === auth.login && password === auth.password) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Bull Board"');
  res.status(401).send('Authentication required.');
});

// ✅ Mount Bull Board router after auth
router.use(serverAdapter.getRouter());

export default router;
