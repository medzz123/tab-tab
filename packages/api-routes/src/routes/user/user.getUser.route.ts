import { z } from 'zod/v4';

import { publicProcedure } from '../../publicProcedure';

export const getUser = publicProcedure
  .input(
    z.object({
      id: z.uuid(),
    })
  )
  .query(async ({ input, ctx }) => {
    const items = ctx.context.db.user.findUniqueOrThrow({
      where: {
        id: input.id,
      },
    });

    return items;
  });
