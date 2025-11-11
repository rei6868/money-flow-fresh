# 🚀 PHASE 2 REMAINING - CONTINUE API ROUTES (GỬI CHO JULES)

> Sao chép toàn bộ nội dung bên dưới vào Google AI Studio (Jules)

---

## 📌 JULES: PHASE 2 REMAINING - Commits 7-15

**Repo:** https://github.com/rei6868/money-flow-fresh

**Current Status:** Commit 1 (GET /api/transactions) ✅ Done
**Remaining:** Commits 7-15 (14 more commits)

---

## 🎯 TASK: Complete Remaining Phase 2 API Routes (14 Commits)

**MỤC ĐÍCH:** Hoàn thành Phase 2 - Code all remaining API endpoints

**Already Done (Commit 6):**
- ✅ `GET /api/transactions` - List transactions with filtering & pagination

**Todo (Commits 7-15):**
- ❌ POST /api/transactions (create)
- ❌ GET/PATCH/DELETE /api/transactions/[id]
- ❌ GET /api/accounts
- ❌ POST /api/accounts
- ❌ GET /api/accounts/[id]/balance
- ❌ Debt endpoints
- ❌ Cashback endpoints
- ❌ People endpoints

---

## 🧪 POSTMAN TEST RESULTS - CURRENT STATE

**Test Report (just ran):**
- ✅ 17 tests passed (44%)
- ❌ 22 tests failed (56%)

**What's working:**
- ✅ GET /api/transactions

**What's failing:**
- ❌ POST endpoints (405 Method Not Allowed)
- ❌ PATCH endpoints (405 Method Not Allowed)
- ❌ DELETE endpoints (405 Method Not Allowed)
- ❌ GET /api/accounts (404 Not Found)
- ❌ GET /api/people (404 Not Found)
- ❌ All other routes (404 Not Found)

**Your task:** Implement remaining endpoints to get 100% test pass rate

---

## 📁 CURRENT PROJECT STATE

**Foundation (Phase 1):** ✅ Complete
```
src/
├── types/database.ts          ✅
├── lib/
│   ├── db.ts                  ✅
│   └── validation.ts          ✅
└── utils/
    ├── calculations.ts        ✅
    ├── formatters.ts          ✅
    └── constants.ts           ✅
```

**API Routes (Phase 2):** ⏳ In Progress
```
src/app/api/
├── transactions/
│   ├── route.ts               ✅ (GET, POST, needs POST/PATCH/DELETE)
│   └── [id]/route.ts          ❌ (PATCH, DELETE not done)
├── accounts/                  ❌ (missing)
├── debt/                       ❌ (missing)
├── cashback/                   ❌ (missing)
└── people/                     ❌ (missing)
```

---

## 📝 COMMIT 7: POST /api/transactions (Create Transaction)

**File:** `src/app/api/transactions/route.ts` (UPDATE - add POST method)

**Already has:** GET method working

**Add POST method:**

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate input with Zod
    const validInput = CreateTransactionSchema.parse(body);

    // 2. Verify account exists
    const account = await queryOne(
      'SELECT * FROM accounts WHERE account_id = $1',
      [validInput.account_id]
    );
    if (!account) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    // 3. Generate transaction ID (use crypto.randomUUID())
    const transactionId = crypto.randomUUID();

    // 4. Insert transaction into database
    const insertQuery = `
      INSERT INTO transactions 
      (transaction_id, account_id, type, amount, fee, occurred_on, notes, person_id, category_id, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const newTxn = await queryOne(insertQuery, [
      transactionId,
      validInput.account_id,
      validInput.type,
      validInput.amount,
      validInput.fee || 0,
      validInput.occurred_on,
      validInput.notes || null,
      validInput.person_id || null,
      validInput.category_id || null,
      validInput.status || 'active'
    ]);

    // 5. If income/expense: calculate and create cashback
    if (['income', 'expense'].includes(validInput.type)) {
      // Get current cycle (e.g., '2024-11')
      const cycleTag = new Date().toISOString().slice(0, 7);
      
      const cashback = await calculateCashback(
        transactionId,
        validInput.account_id,
        validInput.amount,
        cycleTag
      );

      if (cashback.cashback_amount > 0 && cashback.cashback_amount <= (cashback.capped_amount || cashback.cashback_amount)) {
        // Create cashback movement record
        const cashbackId = crypto.randomUUID();
        await execute(
          `INSERT INTO cashback_movements 
           (cashback_movement_id, transaction_id, account_id, cycle_tag, cashback_type, cashback_value, cashback_amount, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [
            cashbackId,
            transactionId,
            validInput.account_id,
            cycleTag,
            cashback.cashback_type,
            cashback.cashback_value,
            cashback.cashback_amount,
            'applied'
          ]
        );
      }
    }

    // 6. If debt type and person_id: create debt movement
    if (validInput.type === 'debt' && validInput.person_id) {
      const cycleTag = new Date().toISOString().slice(0, 7);
      const debtMovementId = crypto.randomUUID();
      
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
          cycleTag,
          'active'
        ]
      );
    }

    return Response.json(newTxn, { status: 201 });
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
curl -X POST https://money-flow-fresh.vercel.app/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "your-account-id",
    "type": "expense",
    "amount": 100.50,
    "occurred_on": "2024-11-11"
  }'
# Should return 201 with transaction_id
```

---

## 📝 COMMIT 8: PATCH/DELETE /api/transactions/[id]

**File:** `src/app/api/transactions/[id]/route.ts` (CREATE NEW)

```typescript
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

    // 2. Validate updates (partial update)
    const updates = UpdateTransactionSchema.partial().parse(body);

    // 3. Build dynamic UPDATE query
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

    const updateQuery = `UPDATE transactions SET ${updateFields.join(', ')} WHERE transaction_id = $${paramIndex} RETURNING *`;
    const newTxn = await queryOne(updateQuery, updateParams);

    // 4. Record in transaction_history
    if (Object.keys(updates).length > 0) {
      await recordTransactionHistory(params.id, oldTxn, newTxn, 'update');
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
    // 1. Get transaction
    const txn = await queryOne(
      'SELECT * FROM transactions WHERE transaction_id = $1',
      [params.id]
    );

    if (!txn) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // 2. Soft delete - set status to canceled
    await execute(
      'UPDATE transactions SET status = $1, updated_at = NOW() WHERE transaction_id = $2',
      ['canceled', params.id]
    );

    // 3. Record in transaction_history
    await recordTransactionHistory(params.id, txn, { status: 'canceled' }, 'delete');

    return Response.json({ success: true, message: 'Transaction deleted (soft delete)' });
  } catch (error) {
    console.error('[DELETE /api/transactions/[id]]', error);
    return Response.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
```

**Test:**
```bash
# PATCH
curl -X PATCH https://money-flow-fresh.vercel.app/api/transactions/transaction-id \
  -H "Content-Type: application/json" \
  -d '{"amount": 150.75}'

# DELETE
curl -X DELETE https://money-flow-fresh.vercel.app/api/transactions/transaction-id
```

---

## 📝 COMMIT 9: GET /api/accounts & POST /api/accounts

**File:** `src/app/api/accounts/route.ts` (CREATE NEW)

```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('person_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = 'SELECT * FROM accounts WHERE 1=1';
    const params: any[] = [];

    if (personId) {
      query += ' AND person_id = $1';
      params.push(personId);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const accounts = await queryMany(query, params);

    return Response.json({
      data: accounts,
      limit,
      offset,
      total: accounts.length
    });
  } catch (error) {
    console.error('[GET /api/accounts]', error);
    return Response.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

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

    const accountId = crypto.randomUUID();
    const insertQuery = `
      INSERT INTO accounts (account_id, person_id, account_name, account_type, currency, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;

    const account = await queryOne(insertQuery, [
      accountId,
      validInput.person_id,
      validInput.account_name,
      validInput.account_type,
      validInput.currency || 'VND',
      validInput.status || 'active'
    ]);

    return Response.json(account, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      );
    }
    console.error('[POST /api/accounts]', error);
    return Response.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
```

---

## 📝 COMMIT 10: GET /api/accounts/[id]/balance

**File:** `src/app/api/accounts/[id]/balance/route.ts` (CREATE NEW)

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
      account_type: account.account_type,
      currency: account.currency,
      current_balance: balance.current_balance,
      as_of_date: asOfDate.toISOString().split('T')[0],
      calculations: balance
    });
  } catch (error) {
    console.error('[GET /api/accounts/[id]/balance]', error);
    return Response.json({ error: 'Failed to calculate balance' }, { status: 500 });
  }
}
```

---

## 📝 COMMIT 11-13: Debt Endpoints

**Similar structure to Accounts:**

### Commit 11: GET /api/debt/ledger & POST

```typescript
// GET /api/debt/ledger - fetch debt ledgers with filters
// POST /api/debt/ledger - create/update debt ledger
```

### Commit 12: GET /api/debt/movements & POST

```typescript
// GET /api/debt/movements - list debt movements
// POST /api/debt/movements - create debt movement
```

### Commit 13: GET/PATCH /api/debt/ledger/[id] & movements/[id]

```typescript
// GET /api/debt/ledger/[id]
// PATCH /api/debt/ledger/[id]
// GET /api/debt/movements/[id]
// PATCH /api/debt/movements/[id]
```

---

## 📝 COMMIT 14: Cashback Endpoints

```typescript
// GET /api/cashback/movements
// POST /api/cashback/movements
// POST /api/cashback/calculate
```

---

## 📝 COMMIT 15: People Endpoints

```typescript
// GET /api/people
// POST /api/people
// GET/PATCH/DELETE /api/people/[id]
```

---

## 🧪 AFTER EACH COMMIT

**Test immediately:**

```bash
# Type check
npm run type-check

# Build
npm run build

# Test with curl
curl https://money-flow-fresh.vercel.app/api/transactions
```

---

## ✅ SUCCESS CRITERIA

After all 14 commits done:

- [ ] All endpoints return 200/201 (not 404/405)
- [ ] POST endpoints return 201 Created
- [ ] PATCH endpoints return 200 Updated
- [ ] DELETE endpoints return soft delete
- [ ] All filters working
- [ ] Pagination working
- [ ] Dynamic variables capture IDs
- [ ] Postman collection runs 100% pass rate

---

## 🚀 ESTIMATED TIME

- Commit 7-8 (Transactions POST/PATCH/DELETE): 1-2 hours
- Commit 9-10 (Accounts): 1 hour
- Commit 11-13 (Debt): 2-3 hours
- Commit 14 (Cashback): 1-2 hours
- Commit 15 (People): 1 hour

**Total: 6-8 hours**

---

## 💡 KEY POINTS

✅ DO:
- Test each commit immediately
- Use parameterized queries
- Validate all inputs
- Record transaction history
- Handle errors properly
- Use calculateAccountBalance() for balance calculation

❌ DON'T:
- Skip validation
- Hardcode UUIDs
- Forget error handling
- Skip transaction history
- Forget to test after each commit

---

## 📌 NOTES

- Foundation (Phase 1) already exists - use it!
- All types already defined in database.ts
- All validation schemas already in validation.ts
- All calculations already in calculations.ts
- Just code the API routes

---

**Start now! Commit 7 onwards!** 🚀

Good luck! 💪
