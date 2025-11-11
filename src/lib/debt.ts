import { z } from 'zod';

export const DebtStatusSchema = z.enum(['open', 'partial', 'repaid', 'overdue']);

export const CreateDebtSchema = z.object({
  debtorAccountId: z.string().uuid(),
  creditorPersonId: z.string().uuid(),
  amount: z.number().int().positive(),
  reason: z.string().optional(),
  dueDate: z.string().datetime(),
});

export const UpdateDebtSchema = z.object({
    amount: z.number().int().positive().optional(),
    status: DebtStatusSchema.optional(),
});


export type CreateDebtInput = z.infer<typeof CreateDebtSchema>;
export type UpdateDebtInput = z.infer<typeof UpdateDebtSchema>;
