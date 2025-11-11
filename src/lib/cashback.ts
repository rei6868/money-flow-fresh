import { z } from 'zod';

export const CreateCashbackSchema = z.object({
  accountId: z.string().uuid(),
  category: z.string(),
  amount: z.number().int().positive(),
  rate: z.number().optional(),
  earnedFrom: z.string().optional(),
});

export type CreateCashbackInput = z.infer<typeof CreateCashbackSchema>;
