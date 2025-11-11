
import { z } from 'zod';

export const AccountTypeSchema = z.enum(['bank', 'credit', 'saving', 'invest', 'e-wallet', 'group', 'loan', 'mortgage', 'cash', 'other']);
export const AccountStatusSchema = z.enum(['active', 'inactive', 'closed', 'suspended']);

export const CreateAccountSchema = z.object({
  accountName: z.string(),
  accountType: AccountTypeSchema,
  currency: z.string(),
  currentBalance: z.number().int(),
});

export const UpdateAccountSchema = CreateAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
