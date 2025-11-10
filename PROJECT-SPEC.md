# Money Flow - Complete Project Specification

## 🎯 Project Overview

**Project Name:** Money Flow  
**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Neon PostgreSQL  
**Status:** Starting Fresh - Complete Architecture with Agent Code-First Approach  

This is a **personal finance management system** with:
- Transaction management with CRUD operations
- Account management (Checking, Savings, Credit)
- Debt tracking and management
- Cashback calculation and tracking
- Balance calculations based on transaction history
- Transaction history with audit trail

---

## 📊 Database Schema

### 1. **PEOPLE Table**
```sql
person_id (UUID, PK)
full_name (VARCHAR)
contact_info (TEXT)
status (ENUM: active, inactive, archived)
group_id (VARCHAR) - optional group assignment
img_url (TEXT)
note (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### 2. **ACCOUNTS Table** 
```sql
account_id (UUID, PK)
person_id (VARCHAR, FK)
account_name (VARCHAR)
account_type (ENUM: checking, savings, credit, investment, wallet)
currency (VARCHAR, default: VND)
status (ENUM: active, inactive, closed, suspended)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### 3. **TRANSACTIONS Table**
```sql
transaction_id (UUID, PK)
account_id (VARCHAR, FK) - required
person_id (VARCHAR, FK) - optional
type (ENUM: expense, income, debt, repayment, cashback, subscription, import, adjustment)
category_id (VARCHAR, FK)
amount (DECIMAL 18,2) - transaction amount
fee (DECIMAL 18,2) - transaction fee
status (ENUM: active, pending, void, canceled)
occurred_on (DATE)
notes (TEXT)
linked_txn_id (VARCHAR, FK) - for related transactions
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### 4. **LINKED_TRANSACTIONS Table**
```sql
linked_txn_id (UUID, PK)
parent_txn_id (VARCHAR, FK) - original transaction
type (ENUM: refund, split, batch, settle)
related_txn_ids (VARCHAR[]) - array of related transaction IDs
status (ENUM: active, done, canceled)
notes (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### 5. **DEBT_LEDGER Table**
```sql
debt_ledger_id (UUID, PK)
person_id (VARCHAR, FK)
cycle_tag (VARCHAR) - monthly/weekly cycle identifier (e.g., "2024-11")
initial_debt (DECIMAL 18,2)
new_debt (DECIMAL 18,2)
repayments (DECIMAL 18,2)
debt_discount (DECIMAL 18,2)
net_debt (DECIMAL 18,2) - calculated: initial + new - repayments - discount
status (ENUM: open, partial, repaid, overdue)
last_updated (TIMESTAMP)
notes (TEXT)

UNIQUE CONSTRAINT: (person_id, cycle_tag)
```

### 6. **DEBT_MOVEMENTS Table**
```sql
debt_movement_id (UUID, PK)
transaction_id (VARCHAR, FK)
person_id (VARCHAR, FK)
account_id (VARCHAR, FK)
movement_type (ENUM: borrow, repay, adjust, discount, split)
amount (DECIMAL 18,2)
cycle_tag (VARCHAR)
status (ENUM: active, settled, reversed)
notes (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)

INDEXES: (person_id, account_id), (account_id, cycle_tag)
```

### 7. **CASHBACK_MOVEMENTS Table**
```sql
cashback_movement_id (UUID, PK)
transaction_id (VARCHAR, FK)
account_id (VARCHAR, FK)
cycle_tag (VARCHAR) - monthly cycle
cashback_type (ENUM: percent, fixed)
cashback_value (DECIMAL 18,4) - percentage or fixed value
cashback_amount (DECIMAL 18,2) - calculated amount
status (ENUM: init, applied, exceed_cap, invalidated)
budget_cap (DECIMAL 18,2) - monthly cap limit
note (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)

INDEX: (account_id, cycle_tag)
```

### 8. **TRANSACTION_HISTORY Table**
```sql
history_id (UUID, PK)
transaction_id (VARCHAR, FK)
transaction_id_snapshot (VARCHAR)
old_amount (DECIMAL 18,2)
new_amount (DECIMAL 18,2)
old_cashback (DECIMAL 18,2)
new_cashback (DECIMAL 18,2)
old_debt (DECIMAL 18,2)
new_debt (DECIMAL 18,2)
action_type (ENUM: update, delete, cashback_update)
seq_no (INTEGER) - sequence number
edited_by (VARCHAR)
created_at (TIMESTAMP)

UNIQUE INDEX: (transaction_id_snapshot, seq_no)
INDEX: transaction_id
```

### 9. **ASSETS Table**
```sql
asset_id (UUID, PK)
asset_name (VARCHAR)
asset_type (ENUM: saving, invest, real_estate, crypto, bond, collateral, other)
owner_id (VARCHAR, FK)
linked_account_id (VARCHAR, FK)
status (ENUM: active, sold, transferred, frozen)
current_value (DECIMAL 18,2)
initial_value (DECIMAL 18,2)
currency (VARCHAR)
acquired_at (DATE)
img_url (TEXT)
notes (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

---

## 🔧 TypeScript Types (Generated from Schema)

```typescript
// types/database.ts

export type PersonStatus = 'active' | 'inactive' | 'archived';
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'wallet';
export type TransactionType = 'expense' | 'income' | 'debt' | 'repayment' | 'cashback' | 'subscription' | 'import' | 'adjustment';
export type TransactionStatus = 'active' | 'pending' | 'void' | 'canceled';
export type LinkedTxnType = 'refund' | 'split' | 'batch' | 'settle';
export type LinkedTxnStatus = 'active' | 'done' | 'canceled';
export type DebtLedgerStatus = 'open' | 'partial' | 'repaid' | 'overdue';
export type DebtMovementType = 'borrow' | 'repay' | 'adjust' | 'discount' | 'split';
export type DebtMovementStatus = 'active' | 'settled' | 'reversed';
export type CashbackType = 'percent' | 'fixed';
export type CashbackStatus = 'init' | 'applied' | 'exceed_cap' | 'invalidated';
export type AssetType = 'saving' | 'invest' | 'real_estate' | 'crypto' | 'bond' | 'collateral' | 'other';
export type AssetStatus = 'active' | 'sold' | 'transferred' | 'frozen';
export type TransactionHistoryAction = 'update' | 'delete' | 'cashback_update';

// Base Types
export interface Person {
  person_id: string;
  full_name: string;
  contact_info?: string;
  status: PersonStatus;
  group_id?: string;
  img_url?: string;
  note?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Account {
  account_id: string;
  person_id: string;
  account_name: string;
  account_type: AccountType;
  currency: string;
  status: string; // 'active' | 'inactive' | 'closed' | 'suspended'
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  transaction_id: string;
  account_id: string;
  person_id?: string;
  type: TransactionType;
  category_id?: string;
  subscription_member_id?: string;
  linked_txn_id?: string;
  status: TransactionStatus;
  amount: number;
  fee?: number;
  occurred_on: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DebtLedger {
  debt_ledger_id: string;
  person_id: string;
  cycle_tag?: string;
  initial_debt: number;
  new_debt: number;
  repayments: number;
  debt_discount?: number;
  net_debt: number; // calculated
  status: DebtLedgerStatus;
  last_updated: Date;
  notes?: string;
}

export interface DebtMovement {
  debt_movement_id: string;
  transaction_id: string;
  person_id: string;
  account_id: string;
  movement_type: DebtMovementType;
  amount: number;
  cycle_tag?: string;
  status: DebtMovementStatus;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CashbackMovement {
  cashback_movement_id: string;
  transaction_id: string;
  account_id: string;
  cycle_tag: string;
  cashback_type: CashbackType;
  cashback_value: number;
  cashback_amount: number;
  status: CashbackStatus;
  budget_cap?: number;
  note?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Asset {
  asset_id: string;
  asset_name: string;
  asset_type: AssetType;
  owner_id: string;
  linked_account_id?: string;
  status: AssetStatus;
  current_value: number;
  initial_value?: number;
  currency?: string;
  acquired_at?: Date;
  img_url?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}
```

---

## 📋 Project Structure

```
money-flow/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Dashboard/home
│   ├── api/
│   │   ├── accounts/
│   │   │   ├── route.ts          # GET all, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET, PATCH, DELETE
│   │   │       └── balance/
│   │   │           └── route.ts  # GET account balance
│   │   ├── transactions/
│   │   │   ├── route.ts          # GET all, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET, PATCH, DELETE
│   │   │       └── history/
│   │   │           └── route.ts  # GET transaction history
│   │   ├── debt/
│   │   │   ├── route.ts          # GET debt ledgers
│   │   │   ├── ledger/
│   │   │   │   ├── route.ts      # Create/update ledger
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  # GET, PATCH
│   │   │   └── movements/
│   │   │       ├── route.ts      # GET, POST movements
│   │   │       └── [id]/
│   │   │           └── route.ts  # GET, PATCH
│   │   ├── cashback/
│   │   │   ├── route.ts          # GET movements
│   │   │   ├── movements/
│   │   │   │   ├── route.ts      # GET, POST movements
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  # PATCH (update status)
│   │   │   └── calculate/
│   │   │       └── route.ts      # POST calculate cashback
│   │   └── people/
│   │       ├── route.ts          # GET all, POST create
│   │       └── [id]/
│   │           └── route.ts      # GET, PATCH, DELETE
│   ├── transactions/
│   │   ├── page.tsx              # Transactions list page
│   │   ├── [id]/
│   │   │   └── page.tsx          # Transaction detail page
│   │   └── new/
│   │       └── page.tsx          # Create transaction page
│   ├── accounts/
│   │   ├── page.tsx              # Accounts list
│   │   ├── [id]/
│   │   │   └── page.tsx          # Account detail
│   │   └── new/
│   │       └── page.tsx          # Create account
│   ├── debt/
│   │   ├── page.tsx              # Debt management
│   │   └── ledgers/
│   │       └── [id]/
│   │           └── page.tsx      # Ledger detail
│   └── dashboard/
│       └── page.tsx              # Main dashboard
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── footer.tsx
│   ├── tables/
│   │   ├── transactions-table.tsx
│   │   ├── accounts-table.tsx
│   │   ├── debt-table.tsx
│   │   └── cashback-table.tsx
│   ├── forms/
│   │   ├── transaction-form.tsx
│   │   ├── account-form.tsx
│   │   └── debt-form.tsx
│   ├── modals/
│   │   ├── add-transaction-modal.tsx
│   │   ├── edit-transaction-modal.tsx
│   │   └── confirm-delete-modal.tsx
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── badge.tsx
│       └── ...other shadcn components
├── lib/
│   ├── db.ts                     # Database connection
│   ├── api-client.ts             # API request helper
│   ├── validation.ts             # Zod schemas
│   └── utils.ts                  # Utility functions
├── utils/
│   ├── calculations.ts           # Balance, debt, cashback calculations
│   ├── formatters.ts             # Date, currency formatters
│   └── constants.ts              # Enums, constants
├── hooks/
│   ├── use-transactions.ts       # Transactions data hook
│   ├── use-accounts.ts           # Accounts data hook
│   ├── use-debt.ts               # Debt data hook
│   └── use-api.ts                # Generic API hook
├── types/
│   ├── database.ts               # All DB types
│   ├── api.ts                    # API request/response types
│   └── forms.ts                  # Form types
└── styles/
    └── globals.css
```

---

## 🔌 API Endpoints Specification

### Transactions API

#### `GET /api/transactions`
```typescript
Query: {
  account_id?: string;
  person_id?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  from_date?: string; // YYYY-MM-DD
  to_date?: string;
  limit?: number;
  offset?: number;
}

Response: {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}
```

#### `POST /api/transactions`
```typescript
Body: {
  account_id: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  occurred_on: string; // YYYY-MM-DD
  notes?: string;
  person_id?: string;
  category_id?: string;
  status?: TransactionStatus; // default: 'active'
}

Response: Transaction (with calculated balance updates)
```

#### `GET /api/transactions/[id]`
```typescript
Response: {
  transaction: Transaction;
  history: TransactionHistory[];
  relatedTransactions?: LinkedTransaction[];
}
```

#### `PATCH /api/transactions/[id]`
```typescript
Body: Partial<{
  amount: number;
  fee: number;
  notes: string;
  status: TransactionStatus;
  occurred_on: string;
}>

Response: {
  transaction: Transaction;
  historicalChange: TransactionHistory;
}
```

#### `DELETE /api/transactions/[id]`
```typescript
Response: {
  success: boolean;
  message: string;
  historicalRecord: TransactionHistory;
}
```

### Accounts API

#### `GET /api/accounts`
```typescript
Query: {
  person_id?: string;
  status?: string;
  type?: AccountType;
  limit?: number;
  offset?: number;
}

Response: {
  data: Account[];
  total: number;
}
```

#### `POST /api/accounts`
```typescript
Body: {
  person_id: string;
  account_name: string;
  account_type: AccountType;
  currency?: string;
  status?: string;
}

Response: Account
```

#### `GET /api/accounts/[id]/balance`
```typescript
Query: {
  as_of_date?: string; // YYYY-MM-DD, default: today
}

Response: {
  account_id: string;
  account_name: string;
  current_balance: number;
  as_of_date: string;
  calculations: {
    total_income: number;
    total_expense: number;
    total_debt: number;
    total_repayments: number;
    total_cashback: number;
    opening_balance: number;
  };
}
```

### Debt API

#### `GET /api/debt/ledger`
```typescript
Query: {
  person_id: string;
  cycle_tag?: string;
}

Response: DebtLedger[]
```

#### `POST /api/debt/ledger`
```typescript
Body: {
  person_id: string;
  cycle_tag: string;
  initial_debt?: number;
}

Response: DebtLedger
```

#### `POST /api/debt/movements`
```typescript
Body: {
  person_id: string;
  account_id: string;
  transaction_id: string;
  movement_type: DebtMovementType;
  amount: number;
  cycle_tag?: string;
  notes?: string;
}

Response: DebtMovement
```

### Cashback API

#### `POST /api/cashback/calculate`
```typescript
Body: {
  transaction_id: string;
  account_id: string;
  amount: number;
  cycle_tag: string;
  cashback_type: CashbackType;
  cashback_value: number; // percentage or fixed
  budget_cap?: number;
}

Response: {
  cashback_movement: CashbackMovement;
  calculatedAmount: number;
  exceededCap?: boolean;
}
```

#### `GET /api/cashback/movements`
```typescript
Query: {
  account_id?: string;
  cycle_tag?: string;
  status?: CashbackStatus;
}

Response: CashbackMovement[]
```

---

## 💼 Key Business Logic Requirements

### 1. **Balance Calculation**

```typescript
// Account balance = Sum of all transactions
// Formula: Opening Balance + Income + Cashback - Expense - Repayment + Adjustment

calculateAccountBalance(accountId: string, asOfDate?: Date): {
  opening_balance: number;
  total_income: number;
  total_expense: number;
  total_debt: number;
  total_repayments: number;
  total_cashback: number;
  current_balance: number;
}
```

**Logic:**
- Get all ACTIVE transactions for account up to `asOfDate`
- Sum by transaction type:
  - `income`: add to balance
  - `expense`: subtract from balance
  - `debt`: track separately (debt_amount)
  - `repayment`: subtract from debt
  - `cashback`: add to balance
  - `adjustment`: add or subtract
- Ignore `pending`, `void`, `canceled` transactions
- Return breakdown of all components

### 2. **Debt Management**

```typescript
// Create/Update debt ledger for each cycle (monthly)
calculateDebtLedger(personId: string, cycleTag: string): DebtLedger {
  - Get all ACTIVE debt movements for this person in cycle
  - initial_debt: opening balance from previous cycle
  - new_debt: sum of 'borrow' movements
  - repayments: sum of 'repay' movements
  - debt_discount: sum of 'discount' movements
  - net_debt = initial_debt + new_debt - repayments - debt_discount
  - status: 
    - 'open' if net_debt > 0 and not due
    - 'partial' if net_debt > 0 and some repayment made
    - 'repaid' if net_debt <= 0
    - 'overdue' if net_debt > 0 and past due date
}
```

**Debt Movement Types:**
- `borrow`: Creates new debt (amount added to new_debt)
- `repay`: Pays down debt (amount subtracted from repayments)
- `adjust`: Manual adjustment
- `discount`: Debt forgiveness/discount
- `split`: Split debt among multiple parties

### 3. **Cashback Calculation**

```typescript
calculateCashback(transaction: Transaction, account: Account): CashbackMovement {
  - Check cashback_type from account settings (percent or fixed)
  - cashback_value: percentage (e.g., 0.5%) or fixed amount
  - cashback_amount = transaction.amount * cashback_value (if percent)
                    = cashback_value (if fixed)
  
  - Check monthly budget_cap
  - If total cashback in cycle exceeds cap:
    - status = 'exceed_cap'
    - cashback_amount = capped amount
  
  - Only calculate for expense and income transactions
  - Exclude debt/repayment/adjustment
  
  - Auto-create negative transaction (cashback credit) to account
}
```

### 4. **Transaction History (Audit Trail)**

```typescript
// Track ALL changes to transactions
recordTransactionHistory(
  transactionId: string,
  oldState: Transaction,
  newState: Transaction,
  actionType: TransactionHistoryAction,
  editedBy?: string
): TransactionHistory

// When updating transaction:
- If amount changes: record old_amount, new_amount
- If cashback changes: record old_cashback, new_cashback
- If debt changes: record old_debt, new_debt
- Maintain seq_no for sequence
- Use transaction_id_snapshot as unique identifier
```

### 5. **Linked Transactions**

```typescript
// Group related transactions (refunds, splits, batch operations)
createLinkedTransaction(
  parentTxnId: string,
  type: LinkedTxnType,
  relatedTxnIds: string[]
): LinkedTransaction

- refund: Original purchase + refund transaction
- split: One transaction split among multiple accounts/people
- batch: Multiple transactions processed together
- settle: Settlement between parties
```

---

## 🎨 UI Components (from Dashboard Image)

### Main Transaction Table Features

**Columns:**
- Checkbox (select row)
- Account ID (truncated with tooltip)
- Account Name
- Type (Badge: Checking, Savings, Credit)
- Current Balance (formatted currency)
- Status (Colored badge: Active, Inactive, Closed)
- Total In (green color)
- Total Out (red color)
- Created At (date)
- Notes (truncated text)
- Actions (quick actions dropdown)

**Features:**
- Search/filter by account name or ID
- Sort by columns
- Pagination
- Bulk actions (select multiple)
- Add new transaction button
- Quick action menu (edit, delete, view details)
- Dark theme (navy #1a1d2e, card #252836)

---

## 🚀 Implementation Priorities

### Phase 1: Core Data Operations
1. **People Management**: CRUD for people
2. **Account Management**: CRUD + balance calculation
3. **Transactions**: Create, read, update, delete
4. **API Integration**: Connect to Neon database

### Phase 2: Business Logic
1. **Balance Calculations**: Account balance endpoint
2. **Debt Tracking**: Debt ledger and movements
3. **Cashback Logic**: Calculate and track cashback
4. **Transaction History**: Audit trail

### Phase 3: UI & UX
1. **Transaction Table**: Display with filtering/sorting
2. **Forms**: Create/edit modals
3. **Dashboard**: Overview with charts
4. **Details Pages**: Individual transaction/account views

### Phase 4: Advanced Features
1. **Linked Transactions**: Refunds, splits, batch
2. **Export/Import**: CSV handling
3. **Analytics**: Charts and insights
4. **Notifications**: Email/in-app alerts

---

## ✅ Testing Checklist

- [ ] All API endpoints return correct data
- [ ] Transaction create updates account balance
- [ ] Debt ledger calculates correctly
- [ ] Cashback respects budget caps
- [ ] Transaction history records all changes
- [ ] Linked transactions group correctly
- [ ] UI table displays data with pagination
- [ ] Forms validate input correctly
- [ ] Delete operations create history records
- [ ] Balance calculations include all transaction types

---

## 🔗 Database Connection

```typescript
// lib/db.ts
import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
export const pool = new Pool({ connectionString });

// Helper functions
export async function query(sql: string, values?: any[]) {
  const result = await pool.query(sql, values);
  return result.rows;
}

export async function queryOne(sql: string, values?: any[]) {
  const result = await pool.query(sql, values);
  return result.rows[0] || null;
}
```

---

## 📝 Development Guidelines

1. **Always use TypeScript** - Strict mode enabled
2. **Database Queries** - Use parameterized queries to prevent SQL injection
3. **Error Handling** - Return proper HTTP status codes and error messages
4. **Validation** - Validate all inputs with Zod schemas
5. **Transactions** - Use database transactions for multi-step operations
6. **Caching** - Cache frequently accessed data (accounts, categories)
7. **Logging** - Log all important operations
8. **Testing** - Write tests for calculation logic

---

## 🎓 Key Files for Agent

**When agent starts coding, provide these in order:**

1. `types/database.ts` - All TypeScript types
2. `lib/db.ts` - Database connection
3. `lib/validation.ts` - Zod schemas
4. `utils/calculations.ts` - Business logic
5. API routes: Start with `/api/transactions`
6. Components: Start with `transactions-table.tsx`

**Do NOT code in this order:**
- ❌ UI without database schema knowledge
- ❌ Frontend without API routes
- ❌ Components without types
- ❌ Calculations without understanding the data model

---

## 🚨 Problem Prevention

**To avoid the previous 256 PR issue:**

1. ✅ Provide complete database schema BEFORE UI coding
2. ✅ Create TypeScript types from schema FIRST
3. ✅ Create API routes with proper validation BEFORE UI
4. ✅ Create calculation logic BEFORE using it in UI
5. ✅ Test all API endpoints with Postman/curl BEFORE UI
6. ✅ Use proper error handling in both API and UI
7. ✅ Validate data at API layer, not just frontend

---

## 📞 Questions for Agent

If agent is unclear, it should ask:

1. "Which calculation should I implement first?"
2. "Should balance include pending transactions?"
3. "What's the starting balance for new accounts?"
4. "How should deleted transactions be handled - soft delete or hard delete?"
5. "What's the cashback formula for this account type?"
