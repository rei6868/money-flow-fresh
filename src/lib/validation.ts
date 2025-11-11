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
  account_name: z.string().min(1, 'Account name is required').max(120, 'Account name must be 120 characters or less'),
  account_type: AccountTypeSchema,
  opening_balance: z.number(),
  current_balance: z.number(),
  status: AccountStatusSchema.default('active'),
  owner_id: z.string().uuid().optional().nullable(),
  parent_account_id: z.string().uuid().optional().nullable(),
  asset_ref: z.string().uuid().optional().nullable(),
  img_url: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  total_in: z.number().optional(),
  total_out: z.number().optional(),
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

export const ApiCreateAccountSchema = z.object({
  accountName: z.string().min(1).max(80),
  accountType: z.enum(['savings', 'checking', 'investment', 'credit']),
  currency: z.enum(['VND', 'USD', 'EUR']),
  currentBalance: z.number().min(0),
});

export const ApiUpdateAccountSchema = z.object({
  accountName: z.string().min(1).max(80).optional(),
  accountType: z.enum(['savings', 'checking', 'investment', 'credit']).optional(),
  status: z.enum(['active', 'inactive', 'closed']).optional(),
});

export const GetDebtQuerySchema = z.object({
  account_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),
  status: z.enum(['active', 'settled', 'overdue']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ApiCreateDebtSchema = z.object({
  debtorAccountId: z.string().uuid(),
  creditorPersonId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string(),
  dueDate: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'Invalid date format, expected YYYY-MM-DD',
  }),
});

export const ApiUpdateDebtSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.enum(['settled', 'active', 'overdue']).optional(),
});

export const GetCashbackQuerySchema = z.object({
  account_id: z.string().uuid().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format, expected YYYY-MM').optional(),
});

export const ApiCreateCashbackSchema = z.object({
  accountId: z.string().uuid(),
  category: z.string(),
  amount: z.number().positive(),
  rate: z.number().positive(),
  earnedFrom: z.string(),
});

export const GetPeopleQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ApiCreateTransactionSchema = z.object({
  accountId: z.string().uuid(),
  personId: z.string().uuid().optional(),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive(),
  category: z.string(),
  description: z.string().optional(),
  transactionDate: z.string().datetime(),
  status: z.enum(['pending', 'completed', 'failed']),
});

export const ApiUpdateTransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  amount: z.number().positive().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
});

export const GetTransactionsQuerySchema = z.object({
  account_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  category: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
