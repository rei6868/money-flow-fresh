# 🚀 PHASE 2 PROMPT - API ROUTES (GỬI CHO JULES)

> Sao chép toàn bộ nội dung bên dưới vào Google AI Studio (Jules)

---

## 📌 JULES: PHASE 2 - API ROUTES (Commits 6-15)

**Repo:** https://github.com/rei6868/money-flow-fresh

**Status:** Phase 1 ✅ Complete. Phase 2: Build API Routes

---

## 🎯 TASK: Phase 2 - API Routes (10 Commits)

**MỤC ĐÍCH:** Tạo tất cả API endpoints với CRUD operations, validation, calculations, và database integration.

**Foundation đã có (Phase 1):**
- ✅ `src/types/database.ts` - All database types
- ✅ `src/lib/db.ts` - DB connection & helpers
- ✅ `src/lib/validation.ts` - Zod schemas
- ✅ `src/utils/calculations.ts` - Business logic
- ✅ `src/utils/formatters.ts` - Format utilities
- ✅ `src/utils/constants.ts` - Constants

**CRITICAL RULES:**
- ✅ Use `/api` routes trong `src/app/api/`
- ✅ Validate input với Zod từ `validation.ts`
- ✅ Query database dùng helpers từ `lib/db.ts`
- ✅ Sử dụng calculations từ `utils/calculations.ts`
- ✅ Return proper HTTP status codes (201, 400, 404, 500)
- ✅ Record transaction history cho mỗi update/delete
- ✅ Handle errors với try-catch
- ✅ Test mỗi endpoint với curl trước commit
- ❌ DO NOT hardcode any IDs
- ❌ DO NOT skip input validation
- ❌ DO NOT forget transaction history recording
- ❌ DO NOT skip error handling

---

## 📁 Folder Structure

Tạo API routes ở:
```
src/app/api/
├── transactions/
│   ├── route.ts              # GET, POST
│   └── [id]/
│       └── route.ts          # GET, PATCH, DELETE
├── accounts/
│   ├── route.ts              # GET, POST
│   └── [id]/
│       ├── route.ts          # GET, PATCH, DELETE
│       └── balance/
│           └── route.ts      # GET balance calculation
├── debt/
│   ├── route.ts              # GET ledgers
│   ├── ledger/
│   │   ├── route.ts          # POST create/update
│   │   └── [id]/route.ts     # GET, PATCH
│   └── movements/
│       ├── route.ts          # GET, POST
│       └── [id]/route.ts     # GET, PATCH
├── cashback/
│   ├── route.ts              # GET movements
│   ├── movements/
│   │   ├── route.ts          # GET, POST
│   │   └── [id]/route.ts     # GET, PATCH
│   └── calculate/
│       └── route.ts          # POST calculate cashback
└── people/
    ├── route.ts              # GET, POST
    └── [id]/route.ts         # GET, PATCH, DELETE
```

---

## 📝 COMMIT 6-8: Transactions API

### COMMIT 6: GET /api/transactions

**Endpoint:** `GET /api/transactions`

**File:** `src/app/api/transactions/route.ts`

**Query Parameters:**
```
?account_id=uuid
&person_id=uuid
&type=expense|income|debt|...
&status=active|pending|void|canceled
&from_date=YYYY-MM-DD
&to_date=YYYY-MM-DD
&limit=10
&offset=0
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "transaction_id": "uuid",
      "account_id": "uuid",
      "type": "expense",
      "amount": 100.50,
      "status": "active",
      "occurred_on": "2024-11-10",
      "created_at": "2024-11-10T12:00:00Z",
      ...
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

**Implementation:**
```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build SQL query with filters
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (accountId) {
      query += ' AND account_id = $' + (params.length + 1);
      params.push(accountId);
    }

    if (type) {
      query += ' AND type = $' + (params.length + 1);
      params.push(type);
    }

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    query += ' ORDER BY occurred_on DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM transactions WHERE 1=1';
    const countParams: any[] = [];

    if (accountId) {
      countQuery += ' AND account_id = $' + (countParams.length + 1);
      countParams.push(accountId);
    }
    // ... repeat filters for count query

    const data = await queryMany(query, params);
    const countResult = await queryOne(countQuery, countParams);

    return Response.json({
      data,
      total: countResult?.count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  } catch (error) {
    console.error('[GET /api/transactions]', error);
    return Response.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
```

---

### COMMIT 7: POST /api/transactions (Create)

**Endpoint:** `POST /api/transactions`

**Request Body:**
```json
{
  "account_id": "uuid",
  "type": "expense",
  "amount": 100.50,
  "fee": 2.50,
  "occurred_on": "2024-11-10",
  "notes": "Lunch",
  "person_id": "uuid (optional)",
  "category_id": "uuid (optional)",
  "status": "active"
}
```

**Response (201 Created):**
```json
{
  "transaction_id": "uuid",
  "account_id": "uuid",
  "type": "expense",
  "amount": 100.50,
  "status": "active",
  "created_at": "2024-11-10T12:00:00Z",
  ...
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": {
    "amount": "Amount must be positive"
  }
}
```

**Implementation:**
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate input
    const validInput = CreateTransactionSchema.parse(body);

    // 2. Verify account exists
    const account = await queryOne(
      'SELECT * FROM accounts WHERE account_id = $1',
      [validInput.account_id]
    );
    if (!account) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    // 3. Generate transaction ID
    const transactionId = generateUUID(); // or crypto.randomUUID()

    // 4. Insert transaction
    await execute(
      `INSERT INTO transactions 
       (transaction_id, account_id, type, amount, fee, occurred_on, notes, person_id, category_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [
        transactionId,
        validInput.account_id,
        validInput.type,
        validInput.amount,
        validInput.fee || 0,
        validInput.occurred_on,
        validInput.notes || null,
        validInput.person_id || null,
        validInput.category_id || null,
        validInput.status || 'active',
      ]
    );

    // 5. Calculate cashback if income/expense
    if (['income', 'expense'].includes(validInput.type)) {
      const cashback = await calculateCashback(
        transactionId,
        validInput.account_id,
        validInput.amount,
        getCurrentCycleTag() // e.g., '2024-11'
      );

      if (cashback.cashback_amount > 0) {
        // Create cashback movement
        const cashbackId = generateUUID();
        await execute(
          `INSERT INTO cashback_movements 
           (cashback_movement_id, transaction_id, account_id, cycle_tag, cashback_type, cashback_value, cashback_amount, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [
            cashbackId,
            transactionId,
            validInput.account_id,
            getCurrentCycleTag(),
            cashback.cashback_type,
            cashback.cashback_value,
            cashback.cashback_amount,
            'applied',
          ]
        );

        // Create cashback transaction (credit to account)
        // This is a negative transaction that increases balance
        // Leave this for now - can be added in Phase 3
      }
    }

    // 6. If debt type: create debt movement
    if (validInput.type === 'debt' && validInput.person_id) {
      const debtMovementId = generateUUID();
      await execute(
        `INSERT INTO debt_movements
         (debt_movement_id, transaction_id, person_id, account_id, movement_type, amount, cycle_tag, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          debtMovementId,
          transactionId,
          validInput.person_id,
          validInput.account_id,
          'borrow',
          validInput.amount,
          getCurrentCycleTag(),
          'active',
        ]
      );
    }

    // 7. Get and return created transaction
    const transaction = await queryOne(
      'SELECT * FROM transactions WHERE transaction_id = $1',
      [transactionId]
    );

    return Response.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      );
    }
    console.error('[POST /api/transactions]', error);
    return Response.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
```

**Test:**
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "your-account-id",
    "type": "expense",
    "amount": 100,
    "occurred_on": "2024-11-10"
  }'
```

---

### COMMIT 8: GET/PATCH/DELETE /api/transactions/[id]

**GET /api/transactions/[id]** - Get transaction + history

**File:** `src/app/api/transactions/[id]/route.ts`

**Response (200 OK):**
```json
{
  "transaction": { ... },
  "history": [
    {
      "history_id": "uuid",
      "action_type": "update",
      "old_amount": 100,
      "new_amount": 110,
      "created_at": "2024-11-10T12:00:00Z"
    }
  ]
}
```

**PATCH /api/transactions/[id]** - Update transaction

**Request Body (all optional):**
```json
{
  "amount": 120,
  "fee": 3,
  "notes": "Updated notes",
  "status": "void"
}
```

**Implementation:**
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transaction = await queryOne(
      'SELECT * FROM transactions WHERE transaction_id = $1',
      [params.id]
    );

    if (!transaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const history = await queryMany(
      'SELECT * FROM transaction_history WHERE transaction_id = $1 ORDER BY seq_no DESC',
      [params.id]
    );

    return Response.json({ transaction, history });
  } catch (error) {
    console.error('[GET /api/transactions/[id]]', error);
    return Response.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // 1. Get old transaction
    const oldTxn = await queryOne(
      'SELECT * FROM transactions WHERE transaction_id = $1',
      [params.id]
    );

    if (!oldTxn) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // 2. Validate updates
    const updates = UpdateTransactionSchema.parse(body);

    // 3. Update transaction
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    if (updates.amount !== undefined) {
      updateFields.push(`amount = $${paramIndex++}`);
      updateParams.push(updates.amount);
    }
    if (updates.fee !== undefined) {
      updateFields.push(`fee = $${paramIndex++}`);
      updateParams.push(updates.fee);
    }
    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      updateParams.push(updates.notes);
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateParams.push(updates.status);
    }

    updateFields.push(`updated_at = NOW()`);
    updateParams.push(params.id);

    const query = `UPDATE transactions SET ${updateFields.join(', ')} WHERE transaction_id = $${paramIndex} RETURNING *`;
    const newTxn = await queryOne(query, updateParams);

    // 4. Record in transaction history
    if (updates.amount !== oldTxn.amount || updates.fee !== oldTxn.fee) {
      await recordTransactionHistory(
        params.id,
        oldTxn,
        newTxn,
        'update'
      );
    }

    // 5. If amount changed: recalculate cashback (optional)
    if (updates.amount && updates.amount !== oldTxn.amount) {
      // Could recalculate cashback here
      // For now, just update the transaction
    }

    return Response.json(newTxn);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      );
    }
    console.error('[PATCH /api/transactions/[id]]', error);
    return Response.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const txn = await queryOne(
      'SELECT * FROM transactions WHERE transaction_id = $1',
      [params.id]
    );

    if (!txn) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Record as deleted (soft delete)
    await execute(
      'UPDATE transactions SET status = $1, updated_at = NOW() WHERE transaction_id = $2',
      ['canceled', params.id]
    );

    // Record in history
    await recordTransactionHistory(
      params.id,
      txn,
      { status: 'canceled' },
      'delete'
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/transactions/[id]]', error);
    return Response.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
```

---

## 📝 COMMIT 9-10: Accounts API

### COMMIT 9: GET/POST /api/accounts

**Endpoints:**
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Create account

**Implementation similar to transactions but simpler:**

```typescript
// GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('person_id');

    let query = 'SELECT * FROM accounts WHERE 1=1';
    const params: any[] = [];

    if (personId) {
      query += ' AND person_id = $1';
      params.push(personId);
    }

    query += ' ORDER BY created_at DESC';

    const accounts = await queryMany(query, params);
    return Response.json({ data: accounts });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// POST
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validInput = CreateAccountSchema.parse(body);

    // Verify person exists
    const person = await queryOne(
      'SELECT * FROM people WHERE person_id = $1',
      [validInput.person_id]
    );
    if (!person) {
      return Response.json({ error: 'Person not found' }, { status: 404 });
    }

    const accountId = generateUUID();
    await execute(
      `INSERT INTO accounts (account_id, person_id, account_name, account_type, currency, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        accountId,
        validInput.person_id,
        validInput.account_name,
        validInput.account_type,
        validInput.currency || 'VND',
        validInput.status || 'active',
      ]
    );

    const account = await queryOne(
      'SELECT * FROM accounts WHERE account_id = $1',
      [accountId]
    );

    return Response.json(account, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      );
    }
    return Response.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
```

---

### COMMIT 10: GET /api/accounts/[id]/balance

**Endpoint:** `GET /api/accounts/[id]/balance?as_of_date=2024-11-10`

**Response:**
```json
{
  "account_id": "uuid",
  "account_name": "Main Checking",
  "current_balance": 5000.50,
  "as_of_date": "2024-11-10",
  "calculations": {
    "total_income": 8500,
    "total_expense": 3200,
    "total_cashback": 150,
    "total_fees": 50,
    "total_debt": 0,
    "total_repayments": 0,
    "opening_balance": 0
  }
}
```

**Implementation:**
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const account = await queryOne(
      'SELECT * FROM accounts WHERE account_id = $1',
      [params.id]
    );

    if (!account) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const asOfDate = searchParams.get('as_of_date')
      ? new Date(searchParams.get('as_of_date')!)
      : new Date();

    const balance = await calculateAccountBalance(params.id, asOfDate);

    return Response.json({
      account_id: params.id,
      account_name: account.account_name,
      current_balance: balance.current_balance,
      as_of_date: formatDate(asOfDate),
      calculations: balance,
    });
  } catch (error) {
    console.error('[GET /api/accounts/[id]/balance]', error);
    return Response.json({ error: 'Failed to calculate balance' }, { status: 500 });
  }
}
```

---

## 📝 COMMIT 11-13: Debt API

Similar structure to Accounts API:

**COMMIT 11:**
- `GET /api/debt/ledger?person_id=...&cycle_tag=...`
- `POST /api/debt/ledger` - Create/update ledger

**COMMIT 12:**
- `GET /api/debt/movements?person_id=...&cycle_tag=...`
- `POST /api/debt/movements` - Create movement

**COMMIT 13:**
- `GET/PATCH /api/debt/ledger/[id]`
- `GET/PATCH /api/debt/movements/[id]`

---

## 📝 COMMIT 14-15: Cashback API + People API

**COMMIT 14:**
- `POST /api/cashback/calculate` - Calculate cashback for transaction
- `GET /api/cashback/movements` - List movements

**COMMIT 15:**
- `GET/POST /api/people`
- `GET/PATCH/DELETE /api/people/[id]`

---

## 🧪 Testing Each Endpoint

Use curl to test:

```bash
# Test GET transactions
curl http://localhost:3000/api/transactions

# Test POST transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"account_id":"xxx","type":"expense","amount":100,"occurred_on":"2024-11-10"}'

# Test account balance
curl http://localhost:3000/api/accounts/xxx/balance
```

---

## ✅ Before Each Commit

- [ ] Test endpoint with curl
- [ ] Check response status code
- [ ] Validate error messages
- [ ] Confirm database records created
- [ ] Verify calculations correct
- [ ] Git commit with clear message

---

## 🎯 Key Principles

1. **Always validate input** with Zod first
2. **Check if resources exist** before operating
3. **Record transaction history** for all updates/deletes
4. **Use calculations** from Phase 1 utils
5. **Return proper status codes** (201 for create, 404 for not found, etc.)
6. **Handle errors gracefully** with try-catch
7. **Test with curl** before committing

---

## 🚫 DO NOTs

- ❌ DO NOT skip input validation
- ❌ DO NOT forget error handling
- ❌ DO NOT hardcode UUIDs for testing (use real IDs)
- ❌ DO NOT skip transaction history recording
- ❌ DO NOT ignore HTTP status codes
- ❌ DO NOT create UI components (Phase 3 only)

---

## ✅ DOs

- ✅ DO validate every input
- ✅ DO test every endpoint
- ✅ DO record all changes
- ✅ DO return proper status codes
- ✅ DO handle errors
- ✅ DO use parameterized queries
- ✅ DO commit after testing

---

## 📦 Deliverables

**After Phase 2:**

```
src/app/api/
├── transactions/
│   ├── route.ts              # GET, POST ✅
│   └── [id]/route.ts         # GET, PATCH, DELETE ✅
├── accounts/
│   ├── route.ts              # GET, POST ✅
│   └── [id]/
│       ├── route.ts          # GET, PATCH, DELETE
│       └── balance/route.ts  # GET balance ✅
├── debt/
│   ├── route.ts              # GET ledgers ✅
│   ├── ledger/
│   │   ├── route.ts          # POST ✅
│   │   └── [id]/route.ts     # GET, PATCH
│   └── movements/
│       ├── route.ts          # GET, POST ✅
│       └── [id]/route.ts     # GET, PATCH
├── cashback/
│   ├── route.ts              # GET
│   ├── movements/route.ts    # POST calculate ✅
│   └── [id]/route.ts         # PATCH status
└── people/
    ├── route.ts              # GET, POST ✅
    └── [id]/route.ts         # GET, PATCH, DELETE
```

**10 focused commits**, all endpoints tested

---

## 🎓 Notes

- This is **Phase 2 only** - API Routes only
- Do NOT create UI components (Phase 3)
- All calculations use Phase 1 utilities
- All validation uses Phase 1 schemas
- Database types from Phase 1

When Phase 2 is complete, Phase 3 will create UI components.

---

**Status:** Ready to code Phase 2 ✅

Good luck! 🚀
