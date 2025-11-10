// src/lib/validation.ts

import { z } from 'zod';

// Enum schemas
export const PersonStatusSchema = z.enum(['active', 'inactive', 'archived']);
export const AccountTypeSchema = z.enum(['checking', 'savings', 'credit', 'investment', 'wallet']);
export const TransactionTypeSchema = z.enum(['expense', 'income', 'debt', 'repayment', 'cashback', 'subscription', 'import', 'adjustment']);
export const TransactionStatusSchema = z.enum(['active', 'pending', 'void', 'canceled']);
export const LinkedTxnTypeSchema = z.enum(['refund', 'split', 'batch', 'settle']);
export const LinkedTxnStatusSchema = z.enum(['active', 'done', 'canceled']);
export const DebtLedgerStatusSchema = z.enum(['open', 'partial', 'repaid', 'overdue']);
export const DebtMovementTypeSchema = z.enum(['borrow', 'repay', 'adjust', 'discount', 'split']);
export const DebtMovementStatusSchema = z.enum(['active', 'settled', 'reversed']);
export const CashbackTypeSchema = z.enum(['percent', 'fixed']);
export const CashbackStatusSchema = z.enum(['init', 'applied', 'exceed_cap', 'invalidated']);
export const AssetTypeSchema = z.enum(['saving', 'invest', 'real_estate', 'crypto', 'bond', 'collateral', 'other']);
export const AssetStatusSchema = z.enum(['active', 'sold', 'transferred', 'frozen']);
export const TransactionHistoryActionSchema = z.enum(['update', 'delete', 'cashback_update']);


// Input schemas
export const CreatePersonSchema = z.object({
  full_name: z.string().min(1, 'Full name required'),
  contact_info: z.string().optional(),
  status: PersonStatusSchema.default('active'),
  group_id: z.string().uuid().optional(),
  note: z.string().optional(),
});
export type CreatePersonInput = z.infer<typeof CreatePersonSchema>;

export const CreateAccountSchema = z.object({
  person_id: z.string().uuid('Invalid person ID'),
  account_name: z.string().min(1, 'Account name required'),
  account_type: AccountTypeSchema,
  currency: z.string().default('VND'),
  status: z.enum(['active', 'inactive', 'closed', 'suspended']).default('active'),
});
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;

export const CreateTransactionSchema = z.object({
  account_id: z.string().uuid('Invalid account ID'),
  type: TransactionTypeSchema,
  amount: z.number().positive('Amount must be positive'),
  fee: z.number().nonnegative().optional(),
  occurred_on: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Invalid date format, expected YYYY-MM-DD",
  }),
  notes: z.string().optional(),
  person_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  status: TransactionStatusSchema.default('active'),
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = CreateTransactionSchema.partial();
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
