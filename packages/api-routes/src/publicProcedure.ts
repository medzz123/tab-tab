import { contextMiddleware, t } from './context';

export const publicProcedure = t.procedure.use(contextMiddleware);
