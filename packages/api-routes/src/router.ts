import { t } from './context';
import { userRouter } from './routes/user/user.routes';

export const router = t.router({
  userRouter,
});

export type Router = typeof router;
