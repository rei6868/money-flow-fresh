# Agent Prompt Template - Money Flow Fresh Start

## 📌 CRITICAL: Read This First Before Coding

This is a **complete specification document** for the Money Flow project. This project has a sophisticated database schema with interconnected tables. **DO NOT CODE without understanding the full data model.**

**Your task:** Follow this specification EXACTLY. Do NOT invent architecture or make assumptions.

---

## ✅ Phase 1: Setup & Foundation (Commit 1-5)

### Commit 1: Database Types & Interfaces

**Instruction:** Create `types/database.ts` with ALL TypeScript interfaces that match the Neon database schema.

**Include:**
- All ENUM types (PersonStatus, AccountType, TransactionType, etc.)
- All main interfaces (Person, Account, Transaction, DebtLedger, DebtMovement, CashbackMovement, Asset, TransactionHistory)
- All properties with correct types (string, number, Date, null-safe)
- Clear JSDoc comments explaining each field
- FK relationships documented

**Output:** Single file with ~400 lines of well-organized TypeScript

**DO NOT:** 
- Create API routes yet
- Build UI components
- Assume any missing fields

**Test:** Import file in test file - should have zero errors

---

### Commit 2: Database Connection & Query Helpers

**Instruction:** Create `lib/db.ts` with database connection and query helper functions.

**Include:**
```typescript
// Connection
import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

// Helpers
export async function queryOne<T>(query: string, params?: any[]): Promise<T | null>
export async function queryMany<T>(query: string, params?: any[]): Promise<T[]>
export async function execute(query: string, params?: any[]): Promise<void>
```

**DO NOT:**
- Use ORMs (Prisma, Drizzle) - keep raw SQL
- Implement connection pooling (Neon handles it)
- Add complex migration logic

**Test:** Run test query: `SELECT * FROM people LIMIT 1` and verify connection works

---

### Commit 3: Validation Schemas (Zod)

**Instruction:** Create `lib/validation.ts` with Zod schemas for all input validation.

**Include schemas for:**
- CreatePersonInput
- CreateAccountInput  
- CreateTransactionInput
- UpdateTransactionInput
- CreateDebtMovementInput
- CreateCashbackMovementInput

**Example:**
```typescript
export const CreateTransactionSchema = z.object({
  account_id: z.string().uuid('Invalid account ID'),
  type: z.enum(['expense', 'income', 'debt', 'repayment', 'cashback', 'subscription', 'import', 'adjustment']),
  amount: z.number().positive('Amount must be positive'),
  fee: z.number().nonnegative().optional(),
  occurred_on: z.string().date(),
  notes: z.string().optional(),
  person_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(['active', 'pending', 'void', 'canceled']).default('active'),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
```

**DO NOT:**
- Validate in UI components
- Create validation for every possible field
- Make validation too strict (allow optional fields)

**Test:** Run schema validation on sample data

---

### Commit 4: Calculation Utilities

**Instruction:** Create `utils/calculations.ts` with all financial calculations.

**Include functions:**

#### 1. **calculateAccountBalance()**
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

// Logic:
// 1. Get all ACTIVE transactions for this account up to asOfDate
// 2. Group by type:
//    - income → add to balance
//    - expense → subtract from balance
//    - cashback → add to balance
//    - debt → track separately, subtract from balance
//    - repayment → track separately, add to balance
//    - adjustment → add/subtract based on amount sign
//    - fee → subtract from balance
// 3. Ignore: pending, void, canceled transactions
// 4. Return breakdown of all components
```

#### 2. **calculateDebtLedger()**
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

// Logic:
// 1. Get previous cycle's net_debt as initial_debt
// 2. Get all ACTIVE debt_movements for this person in cycleTag
// 3. Sum by movement_type:
//    - borrow: add to new_debt
//    - repay: add to repayments
//    - discount: add to debt_discount
//    - adjust: add to adjustment
//    - split: handle separately (divide amount)
// 4. Calculate: net_debt = initial_debt + new_debt - repayments - debt_discount
// 5. Determine status:
//    - net_debt <= 0 → 'repaid'
//    - net_debt > 0 AND some repayments → 'partial'
//    - net_debt > 0 AND past due date → 'overdue'
//    - net_debt > 0 → 'open'
```

#### 3. **calculateCashback()**
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

// Logic:
// 1. Get account cashback settings (assume from account or config)
// 2. Determine cashback_type (percent or fixed)
// 3. Calculate cashback_amount:
//    - If percent: amount * (cashback_value / 100)
//    - If fixed: cashback_value
// 4. Check monthly budget_cap:
//    - Get all APPLIED cashback for account in cycleTag
//    - If total + new_amount > cap:
//      - Set exceeded_cap = true
//      - Set capped_amount = max amount allowed
//      - Return capped amount
// 5. Only calculate for 'expense' and 'income' transactions
//    (NOT debt, repayment, adjustment, subscription)
```

#### 4. **recordTransactionHistory()**
```typescript
export async function recordTransactionHistory(
  transactionId: string,
  oldState: Partial<Transaction>,
  newState: Partial<Transaction>,
  actionType: 'update' | 'delete' | 'cashback_update',
  editedBy?: string
): Promise<void>

// Logic:
// 1. Detect what changed:
//    - If amount changed: record old_amount, new_amount
//    - If fee changed: record in history
//    - If status changed: record in history
//    - (cashback, debt changes handled separately)
// 2. Get current seq_no for this transaction
// 3. Increment seq_no
// 4. Insert into transaction_history table:
//    - transaction_id_snapshot: unique ID for this snapshot
//    - old_amount, new_amount (if changed)
//    - action_type
//    - seq_no
//    - edited_by
//    - created_at: now()
```

**DO NOT:**
- Call external APIs
- Make calculations without database queries
- Assume zero opening balance

**Test:** Run calculations with sample account/person IDs

---

### Commit 5: Utility Functions

**Instruction:** Create `utils/formatters.ts` and `utils/constants.ts`

**formatters.ts:**
```typescript
export function formatCurrency(amount: number, currency = 'VND'): string
export function formatDate(date: Date | string): string
export function formatDateShort(date: Date | string): string
export function truncateString(str: string, maxLen: number): string
export function formatAccountType(type: string): string
export function formatTransactionType(type: string): string
export function getStatusColor(status: string): string // returns Tailwind class
```

**constants.ts:**
```typescript
export const TRANSACTION_TYPES = ['expense', 'income', 'debt', ...];
export const ACCOUNT_TYPES = ['checking', 'savings', 'credit', ...];
export const STATUS_COLORS = { active: 'green', ...};
export const ACCOUNT_STATUS_OPTIONS = [...];
export const DEFAULT_CURRENCY = 'VND';
```

**DO NOT:**
- Use hardcoded colors
- Duplicate enums

**Test:** Import and use in calculations

---

## ✅ Phase 2: API Routes (Commit 6-15)

### Commit 6-8: Transactions API

**Instruction:** Create API routes for transactions CRUD.

**Routes:**

#### `GET /api/transactions`
```typescript
// lib/repositories/transactions.ts - Move query logic here!

export async function getTransactions(filters?: {
  account_id?: string;
  person_id?: string;
  type?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: Transaction[]; total: number }>

// app/api/transactions/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { data, total } = await getTransactions({
      account_id: accountId,
      limit,
      offset,
    });

    return Response.json({ data, total, limit, offset });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

#### `POST /api/transactions`
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Validate input
    const validInput = CreateTransactionSchema.parse(body);
    
    // 2. Verify account exists
    const account = await getAccount(validInput.account_id);
    if (!account) throw new Error('Account not found');
    
    // 3. Generate transaction ID
    const txnId = generateUUID();
    
    // 4. Insert transaction
    await sql('INSERT INTO transactions (...) VALUES (...)', [...]);
    
    // 5. If income/expense: calculate cashback
    if (['income', 'expense'].includes(validInput.type)) {
      const cashback = await calculateCashback(...);
      if (cashback.cashback_amount > 0) {
        // Create cashback movement
        // Create cashback transaction (negative to credit account)
      }
    }
    
    // 6. If debt type: create debt movement
    if (validInput.type === 'debt') {
      await createDebtMovement(...);
    }
    
    // 7. Update debt ledger if necessary
    // 8. Return created transaction with updated balance
    
    return Response.json(transaction, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

#### `PATCH /api/transactions/[id]`
```typescript
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // 1. Get old transaction
    const oldTxn = await getTransaction(params.id);
    
    // 2. Validate updates
    const updates = UpdateTransactionSchema.parse(body);
    
    // 3. Start database transaction (if possible)
    
    // 4. Update transaction
    const newTxn = await sql('UPDATE transactions SET ... WHERE transaction_id = $1', [...]);
    
    // 5. Record in transaction_history
    await recordTransactionHistory(
      params.id,
      oldTxn,
      newTxn,
      'update',
      request.headers.get('x-user-id')
    );
    
    // 6. If amount changed: recalculate cashback
    if (updates.amount && updates.amount !== oldTxn.amount) {
      // Delete old cashback movement
      // Create new cashback movement
    }
    
    // 7. If status changed from active to void: reverse debt/cashback effects
    
    // 8. Return updated transaction
    
    return Response.json(newTxn);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

#### `DELETE /api/transactions/[id]`
```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Get transaction to delete
    const txn = await getTransaction(params.id);
    
    // 2. Record as deleted in transaction_history (don't actually delete)
    await recordTransactionHistory(
      params.id,
      txn,
      { status: 'canceled' },
      'delete'
    );
    
    // 3. Set status to 'canceled'
    await sql('UPDATE transactions SET status = $1 WHERE transaction_id = $2', ['canceled', params.id]);
    
    // 4. Reverse cashback/debt effects
    // 5. Update debt ledger
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

**Key Rules:**
- ✅ ALL write operations must record in transaction_history
- ✅ Validate input BEFORE database operations
- ✅ Recalculate balance after changes
- ✅ Handle cascading effects (cashback, debt)
- ❌ DO NOT allow direct SQL from client
- ❌ DO NOT skip validation

---

### Commit 9-10: Accounts API

**Instruction:** Create `GET /api/accounts`, `POST /api/accounts`, `GET /api/accounts/[id]/balance`

**Key logic:**
```typescript
// GET /api/accounts/[id]/balance
export async function GET(request: Request, { params }) {
  const asOfDate = new URL(request.url).searchParams.get('as_of_date');
  
  const balance = await calculateAccountBalance(params.id, asOfDate ? new Date(asOfDate) : undefined);
  
  return Response.json(balance);
}
```

---

### Commit 11-13: Debt API

**Routes:**
- `GET /api/debt/ledger` - Get debt ledger(s)
- `POST /api/debt/ledger` - Create/update ledger
- `GET /api/debt/movements` - List movements
- `POST /api/debt/movements` - Create movement

**Key logic:**
```typescript
// POST /api/debt/movements
// When creating a debt movement:
// 1. Validate input
// 2. Insert debt_movement
// 3. Recalculate debt_ledger for this person + cycle
// 4. Update debt_ledger.status
// 5. If debt becomes overdue: send notification
```

---

### Commit 14-15: Cashback API

**Routes:**
- `POST /api/cashback/calculate` - Calculate cashback for transaction
- `GET /api/cashback/movements` - List movements by account/cycle

**Key logic:**
```typescript
// POST /api/cashback/calculate
// 1. Validate calculation inputs
// 2. Calculate using calculateCashback()
// 3. Insert into cashback_movements
// 4. If status = 'applied': auto-create cashback transaction (credit account)
// 5. Return calculated movement
```

---

## ✅ Phase 3: UI Components (Commit 16-25)

### Commit 16: Transactions Table Component

**Create:** `components/tables/transactions-table.tsx`

**Requirements:**
- Display transactions in table format
- Columns: Account, Type, Amount, Status, Date, Notes, Actions
- Status badges with colors
- Search/filter functionality
- Pagination
- Sort by columns
- Dark theme (#1a1d2e)

**Implementation:**
- Use React hooks (useState, useEffect) - NO Next.js client components yet
- Fetch data from `/api/transactions`
- Show loading state
- Handle errors with proper messages

---

### Commit 17-18: Transaction Forms

**Create:** `components/forms/transaction-form.tsx`

**For both Create and Update:**
- Account selector dropdown
- Type selector (enum)
- Amount input (number with currency)
- Fee input
- Date picker (occurred_on)
- Notes textarea
- Status selector
- Submit button with loading state
- Error handling

**Do NOT:**
- Validate in component - validate via API
- Hardcode options - fetch from API/constants
- Create separate create/update components - use conditional rendering

---

### Commit 19-20: Account Components

**Create:**
- `components/tables/accounts-table.tsx`
- `components/forms/account-form.tsx`
- Account card showing balance, type, status

---

### Commit 21-22: Debt Components

**Create:**
- `components/tables/debt-ledger-table.tsx`
- Debt summary card
- Debt movement form

---

### Commit 23: Pages (Routes)

**Create:**
- `app/transactions/page.tsx` - List page
- `app/transactions/new/page.tsx` - Create page
- `app/accounts/page.tsx` - List page

**Structure:**
```typescript
export default function TransactionsPage() {
  return (
    <div className="bg-[#1a1d2e] min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <Link href="/transactions/new">
            <button className="btn-primary">+ Add Transaction</button>
          </Link>
        </div>
        <TransactionsTable />
      </div>
    </div>
  );
}
```

---

### Commit 24-25: Dashboard & Layout

**Create:**
- `app/layout.tsx` - Root layout with sidebar
- `app/dashboard/page.tsx` - Dashboard with overview
- `components/layout/sidebar.tsx`
- `components/layout/header.tsx`

---

## 🚫 CRITICAL DO NOTs

1. ❌ **DO NOT code UI without understanding the database**
2. ❌ **DO NOT create API routes without validation**
3. ❌ **DO NOT hardcode IDs or test data**
4. ❌ **DO NOT skip error handling**
5. ❌ **DO NOT use deprecated Next.js patterns**
6. ❌ **DO NOT create 256 branches without completing features**
7. ❌ **DO NOT assume balance includes pending transactions (until told otherwise)**
8. ❌ **DO NOT create UI without working API first**
9. ❌ **DO NOT use client-side calculations - ALWAYS use API**
10. ❌ **DO NOT forget to handle soft deletes (canceled status)**

---

## ✅ CRITICAL DO DOs

1. ✅ **Test API endpoints with curl/Postman BEFORE creating UI**
2. ✅ **Use TypeScript strictly - enable strict mode**
3. ✅ **Create types from database schema - NOT from assumptions**
4. ✅ **Use parameterized SQL queries**
5. ✅ **Validate ALL inputs**
6. ✅ **Record all changes in transaction_history**
7. ✅ **Handle cascading updates (cashback, debt, balance)**
8. ✅ **Use proper HTTP status codes**
9. ✅ **Add JSDoc comments on functions**
10. ✅ **Test calculations with real database data**

---

## 🧪 Testing Checklist for Each Commit

### After Commit 1 (Types):
- [ ] Import types in test file - zero errors
- [ ] All enums are defined
- [ ] All FK relationships documented

### After Commit 2 (DB):
- [ ] Run `SELECT 1` query - connection works
- [ ] Run `SELECT * FROM people LIMIT 1` - returns data
- [ ] queryOne() returns single object or null
- [ ] queryMany() returns array

### After Commit 4 (Calculations):
- [ ] calculateAccountBalance(accountId) returns complete object
- [ ] All numbers are correctly calculated
- [ ] Edge cases handled (empty account, negative balance)

### After Commit 6 (GET /api/transactions):
- [ ] curl `http://localhost:3000/api/transactions` returns 200
- [ ] Response includes pagination info
- [ ] Filters work (account_id, type, status)

### After Commit 7 (POST /api/transactions):
- [ ] Create transaction with valid data - returns 201
- [ ] Invalid data - returns 400 with error message
- [ ] Account balance updates after transaction
- [ ] Cashback calculated for income/expense
- [ ] Transaction history recorded

### After Commit 16 (Table UI):
- [ ] Table displays transactions from API
- [ ] Pagination works
- [ ] Search filters results
- [ ] Status badges show correct colors
- [ ] Currency formatted correctly

---

## 🎯 Final Checklist Before Deployment

- [ ] All API endpoints return correct status codes
- [ ] All calculations tested with real data
- [ ] Transaction history working for all operations
- [ ] Debt ledger updating correctly
- [ ] Cashback capped properly
- [ ] UI displays all data correctly
- [ ] Forms validate input
- [ ] Delete operations soft-delete (canceled status)
- [ ] Search and filter working
- [ ] Pagination working
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All 256 PRs issues RESOLVED
