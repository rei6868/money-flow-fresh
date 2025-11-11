
import { z } from 'zod';

export const TransactionTypeSchema = z.enum(['income', 'expense', 'transfer']);
export const TransactionStatusSchema = z.enum(['pending', 'completed', 'failed']);

export const CreateTransactionSchema = z.object({
  accountId: z.string().uuid(),
  personId: z.string().uuid().optional(),
  type: TransactionTypeSchema,
  amount: z.number().int().positive(),
  category: z.string(),
  description: z.string().optional(),
  transactionDate: z.string().datetime(),
  status: TransactionStatusSchema,
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
