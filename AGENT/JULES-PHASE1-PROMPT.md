# 🚀 PHASE 1 PROMPT - GỬI CHO JULES

> Sao chép toàn bộ nội dung bên dưới vào Google AI Studio (Jules) hoặc chatbot bạn dùng để code

---

## 📌 JULES: PHASE 1 - FOUNDATION (Commits 1-5)

Repo: https://github.com/rei6868/money-flow-fresh

Tôi đang xây dựng ứng dụng quản lý tài chính cá nhân **Money Flow** dùng **Next.js 14+ với App Router, TypeScript, Tailwind CSS, và Neon PostgreSQL**.

Tôi đã setup:
- ✅ Next.js project với TypeScript
- ✅ Tailwind CSS
- ✅ `.env.local` với DATABASE_URL từ Neon
- ✅ `PROJECT-SPEC.md` - đầy đủ database schema, API specs, business logic
- ✅ `AGENT-PROMPT.md` - hướng dẫn chi tiết

---

## 🎯 TASK: Phase 1 - Foundation (5 Commits)

**MỤC ĐÍCH:** Tạo nền tảng cơ bản - Types, DB Connection, Validation, Calculations.

**CRITICAL RULES:**
- ✅ Đọc PROJECT-SPEC.md HOÀN TOÀN trước khi code
- ✅ Tuân theo spec CHÍNH XÁC - không thêm, không bớt
- ✅ Sử dụng TypeScript strict mode
- ✅ Sử dụng raw SQL (không dùng ORM như Prisma/Drizzle)
- ✅ Parameterized queries để prevent SQL injection
- ✅ Test mỗi commit
- ❌ DO NOT tạo API routes (đợi Phase 2)
- ❌ DO NOT tạo UI components (đợi Phase 3)
- ❌ DO NOT skip error handling
- ❌ DO NOT assume values không có trong schema

---

## 📝 COMMIT 1: Database Types

**File:** `src/types/database.ts`

**Yêu Cầu:**
- Tạo tất cả ENUM types từ DATABASE SCHEMA
- Tạo tất cả interfaces/types cho 9 tables: Person, Account, Transaction, LinkedTransaction, DebtLedger, DebtMovement, CashbackMovement, TransactionHistory, Asset
- Mỗi field phải có comment giải thích
- Nullable fields phải dùng `| null`
- FK relationships phải đóc trong comments

**ENUM Types cần có:**
```
PersonStatus, AccountType, TransactionType, TransactionStatus,
LinkedTxnType, LinkedTxnStatus, DebtLedgerStatus, DebtMovementType,
DebtMovementStatus, CashbackType, CashbackStatus, AssetType, AssetStatus,
TransactionHistoryAction
```

**Ví dụ cấu trúc:**
```typescript
// types/database.ts

// ENUMs
export type PersonStatus = 'active' | 'inactive' | 'archived';
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'wallet';
// ... more enums

// Interfaces
export interface Person {
  person_id: string;
  full_name: string;
  // ... other fields
}

export interface Transaction {
  transaction_id: string;
  account_id: string;
  // ... other fields
}
// ... more interfaces
```

**Output:** ~400 lines, zero TypeScript errors

**Test:** 
```bash
import { Person, Transaction } from '@/types/database';
// Should have zero errors
```

---

## 📝 COMMIT 2: Database Connection

**Files:** 
- `src/lib/db.ts` - Connection & helpers
- `.gitignore` - Make sure `.env.local` is ignored

**Yêu Cầu:**

```typescript
// src/lib/db.ts

import { neon } from '@neondatabase/serverless';

// Setup SQL connection
export const sql = neon(process.env.DATABASE_URL!);

// Helper functions
export async function queryOne<T>(
  query: string,
  params?: (string | number | boolean | null)[]
): Promise<T | null> {
  // Execute query and return first row or null
}

export async function queryMany<T>(
  query: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  // Execute query and return all rows
}

export async function execute(
  query: string,
  params?: (string | number | boolean | null)[]
): Promise<void> {
  // Execute query and return nothing
}
```

**Rules:**
- Sử dụng Neon serverless connection
- Sử dụng parameterized queries với `$1, $2, $3` placeholders
- Error handling trong mỗi function
- Proper TypeScript types

**Test:**
```bash
# Run SELECT 1 query
import { queryOne } from '@/lib/db';
const result = await queryOne<number>('SELECT 1 as num');
console.log(result); // { num: 1 }
```

---

## 📝 COMMIT 3: Validation Schemas (Zod)

**File:** `src/lib/validation.ts`

**Yêu Cầu:**

Tạo Zod schemas cho tất cả inputs:

```typescript
// src/lib/validation.ts

import { z } from 'zod';

// Enum schemas
export const PersonStatusSchema = z.enum(['active', 'inactive', 'archived']);
export const AccountTypeSchema = z.enum(['checking', 'savings', 'credit', 'investment', 'wallet']);
export const TransactionTypeSchema = z.enum(['expense', 'income', 'debt', 'repayment', 'cashback', 'subscription', 'import', 'adjustment']);
// ... more enum schemas

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
  occurred_on: z.string().date('Invalid date format'),
  notes: z.string().optional(),
  person_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(['active', 'pending', 'void', 'canceled']).default('active'),
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = CreateTransactionSchema.partial();
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;

// ... more schemas for Debt, Cashback, etc.
```

**Rules:**
- Mỗi schema phải có descriptive error messages
- Optional fields phải dùng `.optional()`
- Dates phải format `YYYY-MM-DD`
- Numbers phải validate min/max
- Strings phải validate length nếu cần

**Export types từ schemas** dùng `z.infer`

**Test:**
```bash
import { CreateTransactionSchema } from '@/lib/validation';

const validData = {
  account_id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'expense',
  amount: 100,
  occurred_on: '2024-11-10',
};

const result = CreateTransactionSchema.parse(validData);
// Should pass

const invalidData = { type: 'invalid', amount: -10 };
// Should throw validation error
```

---

## 📝 COMMIT 4: Calculation Utilities

**File:** `src/utils/calculations.ts`

**Yêu Cầu:**

Tạo 4 functions chính cho business logic:

### 1. calculateAccountBalance()
```typescript
export async function calculateAccountBalance(
  accountId: string,
  asOfDate?: Date
): Promise<{
  opening_balance: number;
  total_income: number;
  total_expense: number;
  total_debt: number;
  total_repayments: number;
  total_cashback: number;
  total_fees: number;
  current_balance: number;
}>
```

**Logic:**
- Lấy tất cả ACTIVE transactions cho account đến `asOfDate` (default: today)
- Tính tổng theo transaction type:
  - `income`: add to balance
  - `expense`: subtract from balance
  - `cashback`: add to balance
  - `debt`: subtract from balance (track separately)
  - `repayment`: add back to balance (track separately)
  - `adjustment`: add/subtract based on amount sign
  - `fee`: subtract from balance
- Ignore: `pending`, `void`, `canceled` status
- Return complete breakdown

### 2. calculateDebtLedger()
```typescript
export async function calculateDebtLedger(
  personId: string,
  cycleTag: string
): Promise<{
  initial_debt: number;
  new_debt: number;
  repayments: number;
  debt_discount: number;
  net_debt: number;
  status: 'open' | 'partial' | 'repaid' | 'overdue';
}>
```

**Logic:**
- Lấy previous cycle's net_debt as initial_debt
- Lấy tất cả ACTIVE debt_movements cho person trong cycle
- Tính tổng theo movement_type:
  - `borrow`: add to new_debt
  - `repay`: add to repayments
  - `discount`: add to debt_discount
  - `adjust`: add/subtract
  - `split`: divide amount
- Calculate: net_debt = initial_debt + new_debt - repayments - debt_discount
- Determine status:
  - net_debt <= 0 → 'repaid'
  - net_debt > 0 AND some repayments → 'partial'
  - net_debt > 0 AND past due date → 'overdue'
  - net_debt > 0 → 'open'

### 3. calculateCashback()
```typescript
export async function calculateCashback(
  transactionId: string,
  accountId: string,
  amount: number,
  cycleTag: string
): Promise<{
  cashback_type: 'percent' | 'fixed';
  cashback_value: number;
  cashback_amount: number;
  exceeded_cap: boolean;
  capped_amount?: number;
}>
```

**Logic:**
- Get account cashback settings (tạm thời assume fixed config)
- Calculate cashback_amount:
  - If percent: amount * (cashback_value / 100)
  - If fixed: cashback_value
- Check monthly budget_cap:
  - Get all APPLIED cashback for account trong cycle
  - If total + new_amount > cap:
    - Set exceeded_cap = true
    - Return capped amount
- Only calculate for `expense` and `income` types
  - NOT debt, repayment, adjustment, subscription

### 4. recordTransactionHistory()
```typescript
export async function recordTransactionHistory(
  transactionId: string,
  oldState: Partial<Transaction>,
  newState: Partial<Transaction>,
  actionType: 'update' | 'delete' | 'cashback_update',
  editedBy?: string
): Promise<void>
```

**Logic:**
- Detect what changed (amount, fee, status, etc.)
- Get current seq_no for this transaction
- Increment seq_no
- Insert into transaction_history:
  - transaction_id_snapshot: unique snapshot ID
  - old_amount, new_amount (if changed)
  - action_type
  - seq_no
  - edited_by
  - created_at: now()

**Rules:**
- ALL calculations phải query từ database
- Handle edge cases (empty account, zero balance)
- Add try-catch error handling
- Add JSDoc comments trên mỗi function
- Return proper types

**Test:**
```bash
import { calculateAccountBalance } from '@/utils/calculations';

// Test with real account_id from database
const balance = await calculateAccountBalance('account-uuid-here');
console.log(balance);
// Should return: { opening_balance: 0, total_income: X, ... }
```

---

## 📝 COMMIT 5: Formatter & Constant Utilities

**Files:**
- `src/utils/formatters.ts`
- `src/utils/constants.ts`

### formatters.ts

```typescript
// src/utils/formatters.ts

export function formatCurrency(
  amount: number,
  currency: string = 'VND'
): string {
  // Format as currency with commas
  // Example: 1000000 VND → "1,000,000 VND"
}

export function formatDate(date: Date | string): string {
  // Format as DD/MM/YYYY
}

export function formatDateShort(date: Date | string): string {
  // Format as MM/DD/YYYY
}

export function truncateString(str: string, maxLen: number): string {
  // Truncate string and add "..." if longer than maxLen
}

export function formatAccountType(type: string): string {
  // Format enum to readable string
  // 'checking' → 'Checking Account'
}

export function formatTransactionType(type: string): string {
  // Format enum to readable string
  // 'expense' → 'Expense'
}

export function getStatusColor(status: string): string {
  // Return Tailwind CSS class for status color
  // 'active' → 'text-green-500'
  // 'inactive' → 'text-yellow-500'
}
```

### constants.ts

```typescript
// src/utils/constants.ts

export const TRANSACTION_TYPES = [
  'expense',
  'income',
  'debt',
  'repayment',
  'cashback',
  'subscription',
  'import',
  'adjustment',
] as const;

export const ACCOUNT_TYPES = [
  'checking',
  'savings',
  'credit',
  'investment',
  'wallet',
] as const;

export const ACCOUNT_STATUS_OPTIONS = [
  'active',
  'inactive',
  'closed',
  'suspended',
] as const;

export const TRANSACTION_STATUS_OPTIONS = [
  'active',
  'pending',
  'void',
  'canceled',
] as const;

export const DEBT_LEDGER_STATUSES = [
  'open',
  'partial',
  'repaid',
  'overdue',
] as const;

export const DEFAULT_CURRENCY = 'VND';

export const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-500',
  inactive: 'text-yellow-500',
  closed: 'text-gray-500',
  pending: 'text-blue-500',
  overdue: 'text-red-500',
};
```

**Rules:**
- Không hardcode strings ở nhiều chỗ
- Dùng constants centrally
- Format functions nên re-usable

---

## ✅ TESTING PHASE 1

Sau khi hoàn thành 5 commits, test như sau:

```bash
# 1. Check TypeScript
npm run type-check
# Result: Should have ZERO errors

# 2. Test database connection
import { queryOne } from '@/lib/db';
const test = await queryOne('SELECT 1 as num');
console.log(test); // { num: 1 }

# 3. Test validation
import { CreateTransactionSchema } from '@/lib/validation';
const data = CreateTransactionSchema.parse({
  account_id: 'uuid',
  type: 'expense',
  amount: 100,
  occurred_on: '2024-11-10',
});
console.log(data); // Validated data

# 4. Test calculations
import { calculateAccountBalance } from '@/utils/calculations';
const balance = await calculateAccountBalance('your-account-id');
console.log(balance); // Balance breakdown

# 5. Check git log
git log --oneline
# Should see 5 commits for Phase 1
```

---

## 🚫 CRITICAL DO NOTs

- ❌ DO NOT create API routes yet (Phase 2)
- ❌ DO NOT create components (Phase 3)
- ❌ DO NOT use Prisma/Drizzle (use raw SQL)
- ❌ DO NOT skip parameterized queries
- ❌ DO NOT assume schema fields
- ❌ DO NOT skip error handling
- ❌ DO NOT commit without testing

---

## ✅ CRITICAL DOs

- ✅ DO read PROJECT-SPEC.md completely
- ✅ DO use TypeScript strictly
- ✅ DO test each commit
- ✅ DO handle errors properly
- ✅ DO add JSDoc comments
- ✅ DO commit with clear messages:
  ```bash
  git commit -m "feat(types): create database type definitions"
  git commit -m "feat(db): setup Neon connection helpers"
  git commit -m "feat(validation): add Zod schemas"
  git commit -m "feat(calculations): implement balance calculation"
  git commit -m "feat(utils): add formatters and constants"
  ```

---

## 📦 Deliverables

**After Phase 1 Completion:**

Folder structure:
```
src/
├── types/
│   └── database.ts           (400+ lines)
├── lib/
│   ├── db.ts                 (connection + helpers)
│   └── validation.ts         (Zod schemas)
└── utils/
    ├── calculations.ts       (4 main functions)
    ├── formatters.ts         (format utilities)
    └── constants.ts          (constants & enums)
```

Git commits: 5 focused commits, each testing passing

---

## 🎓 Notes

- This is **Phase 1 only** - Foundation only
- Do NOT proceed beyond Phase 1 without completion
- Do NOT code API routes or UI yet
- Next Phase will use these files to create API routes
- Final Phase will create UI components

When Phase 1 is complete, I'll give you Phase 2 instructions.

---

**Status:** Ready to code Phase 1 ✅

**Next:** Git push Phase 1 commits → I'll review → Phase 2 instructions

Good luck! 🚀
