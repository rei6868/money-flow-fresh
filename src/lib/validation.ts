// src/lib/validation.ts

import { z } from 'zod';

// Corrected Enum schemas based on database introspection
export const AccountTypeSchema = z.enum(['bank', 'credit', 'saving', 'invest', 'e-wallet', 'group', 'loan', 'mortgage', 'cash', 'other']);
export const AccountStatusSchema = z.enum(['active', 'inactive', 'closed', 'suspended']);

// Other existing schemas
export const PersonStatusSchema = z.enum(['active', 'inactive', 'archived']);
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
  accountName: z.string().min(1, 'Account name is required').max(120, 'Account name must be 120 characters or less'),
  accountType: AccountTypeSchema,
  openingBalance: z.number(),
  currentBalance: z.number(),
  currency: z.string().optional(),
  status: AccountStatusSchema.default('active'),
  ownerId: z.string().uuid().optional().nullable(),
  parentAccountId: z.string().uuid().optional().nullable(),
  assetRef: z.string().uuid().optional().nullable(),
  imgUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  totalIn: z.number().optional(),
  totalOut: z.number().optional(),
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
