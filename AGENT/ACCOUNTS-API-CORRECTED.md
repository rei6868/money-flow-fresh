# 🚀 ACCOUNTS API FIX - CORRECTED SCHEMA & IMPLEMENTATION

> Sao chép toàn bộ nội dung bên dưới vào Google AI Studio (Jules)

---

## 📌 CRITICAL: SCHEMA CORRECTION & API IMPLEMENTATION

**Previous status:** Schema mismatch caused account creation failures
**Current action:** Implement accounts API with CORRECT REAL schema from Neon

**Repo:** https://github.com/rei6868/money-flow-fresh

---

## 🎯 TASK: Implement Accounts API (Commits 9-10) with CORRECTED SCHEMA

### ⚠️ IMPORTANT: REAL SCHEMA FROM NEON DATABASE

The accounts table has these columns (DEFINITIVE from Neon export):

```sql
CREATE TABLE "accounts" (
    "account_id" varchar(36) PRIMARY KEY NOT NULL,
    "account_name" varchar(120) NOT NULL,
    "img_url" text,
    "account_type" account_type NOT NULL,
    "owner_id" varchar(36),
    "parent_account_id" varchar(36),
    "asset_ref" varchar(36),
    "opening_balance" numeric(18,2) NOT NULL,
    "current_balance" numeric(18,2) NOT NULL,
    "status" account_status NOT NULL,
    "total_in" numeric(18,2) NOT NULL DEFAULT 0,
    "total_out" numeric(18,2) NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "notes" text
);
```

**KEY DIFFERENCES FROM PREVIOUS UNDERSTANDING:**
- ✅ NO `currency` column (remove from code)
- ✅ HAS `owner_id` (NOT dropped - still exists)
- ✅ HAS `parent_account_id` (hierarchical accounts support)
- ✅ HAS `asset_ref` (link to assets)
- ✅ HAS `opening_balance` (MUST provide when creating)
- ✅ HAS `total_in` & `total_out` (track sums)
- ✅ HAS `img_url` (account image)
- ⚠️ `account_name` max 120 chars (NOT 80)

---

## 📝 COMMIT 9: GET & POST /api/accounts (CORRECTED)

**File:** `src/app/api/accounts/route.ts` (CREATE NEW)

```typescript
import { queryOne, queryMany, execute } from '@/lib/db';
import { CreateAccountSchema } from '@/lib/validation';
import { z } from 'zod';
import { Response } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner_id = searchParams.get('owner_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = 'SELECT * FROM accounts WHERE 1=1';
    const params: any[] = [];

    // Filter by owner if provided
    if (owner_id) {
      query += ' AND owner_id = $' + (params.length + 1);
      params.push(owner_id);
    }

    // Pagination
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
    return Response.json(
      { error: 'Failed to fetch accounts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input - UPDATED to match REAL schema
    const validInput = {
      account_name: body.account_name,
      img_url: body.img_url || null,
      account_type: body.account_type,
      owner_id: body.owner_id || null,
      parent_account_id: body.parent_account_id || null,
      asset_ref: body.asset_ref || null,
      opening_balance: body.opening_balance || 0,
      status: body.status || 'active',
      notes: body.notes || null
    };

    // Validate required fields
    if (!validInput.account_name || validInput.account_name.trim().length === 0) {
      return Response.json(
        { error: 'Validation failed', details: { account_name: 'Account name is required' } },
        { status: 400 }
      );
    }

    if (!validInput.account_type) {
      return Response.json(
        { error: 'Validation failed', details: { account_type: 'Account type is required' } },
        { status: 400 }
      );
    }

    if (validInput.account_name.length > 120) {
      return Response.json(
        { error: 'Validation failed', details: { account_name: 'Account name must be 120 characters or less' } },
        { status: 400 }
      );
    }

    // Generate account ID
    const accountId = crypto.randomUUID();

    // Insert account into database
    const insertQuery = `
      INSERT INTO accounts 
      (account_id, account_name, img_url, account_type, owner_id, parent_account_id, asset_ref, opening_balance, current_balance, status, total_in, total_out, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;

    const account = await queryOne(insertQuery, [
      accountId,
      validInput.account_name,
      validInput.img_url,
      validInput.account_type,
      validInput.owner_id,
      validInput.parent_account_id,
      validInput.asset_ref,
      validInput.opening_balance,
      validInput.opening_balance, // current_balance = opening_balance initially
      validInput.status,
      0, // total_in default
      0, // total_out default
      validInput.notes
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
    return Response.json(
      { error: 'Failed to create account', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**Test POST:**
```bash
curl -X POST https://money-flow-fresh.vercel.app/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "account_name": "My Checking Account",
    "account_type": "checking",
    "owner_id": null,
    "opening_balance": 0,
    "status": "active"
  }'

# Should return 201 with account_id
```

**Test GET:**
```bash
curl https://money-flow-fresh.vercel.app/api/accounts
# Should return array of accounts
```

---

## 📝 COMMIT 10: GET /api/accounts/[id]/balance (CORRECTED)

**File:** `src/app/api/accounts/[id]/balance/route.ts` (CREATE NEW)

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Get account
    const account = await queryOne(
      'SELECT * FROM accounts WHERE account_id = $1',
      [params.id]
    );

    if (!account) {
      return Response.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // 2. Get balance using calculations (if implemented in Phase 1)
    // For now, return current_balance, total_in, total_out from account table
    const balance = await calculateAccountBalance(params.id);

    return Response.json({
      account_id: params.id,
      account_name: account.account_name,
      account_type: account.account_type,
      current_balance: account.current_balance,
      opening_balance: account.opening_balance,
      total_in: account.total_in,
      total_out: account.total_out,
      status: account.status,
      calculations: balance || {
        current_balance: account.current_balance,
        opening_balance: account.opening_balance,
        total_in: account.total_in,
        total_out: account.total_out
      }
    });
  } catch (error) {
    console.error('[GET /api/accounts/[id]/balance]', error);
    return Response.json(
      { error: 'Failed to get account balance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**Test:**
```bash
curl https://money-flow-fresh.vercel.app/api/accounts/account-id/balance
# Should return balance details
```

---

## ✅ KEY POINTS - MUST FOLLOW

### Field Mapping:

| Field | Type | Required | Nullable | Notes |
|-------|------|----------|----------|-------|
| account_id | varchar(36) | ✅ Auto-generated | ❌ | Use crypto.randomUUID() |
| account_name | varchar(120) | ✅ YES | ❌ | Max 120 chars (NOT 80!) |
| img_url | text | ❌ NO | ✅ | Optional image URL |
| account_type | enum | ✅ YES | ❌ | Must be valid enum |
| owner_id | varchar(36) | ❌ NO | ✅ | Optional user/person link |
| parent_account_id | varchar(36) | ❌ NO | ✅ | Optional parent account |
| asset_ref | varchar(36) | ❌ NO | ✅ | Optional link to asset |
| opening_balance | numeric(18,2) | ✅ YES | ❌ | MUST provide (default 0) |
| current_balance | numeric(18,2) | ✅ YES | ❌ | Calculated/tracked |
| status | enum | ✅ YES | ❌ | Default 'active' |
| total_in | numeric(18,2) | ✅ YES | ❌ | Default 0 |
| total_out | numeric(18,2) | ✅ YES | ❌ | Default 0 |
| created_at | timestamp | ✅ YES | ❌ | Auto: now() |
| updated_at | timestamp | ✅ YES | ❌ | Auto: now() |
| notes | text | ❌ NO | ✅ | Optional notes |

### On INSERT:
- ✅ Always provide: account_id, account_name, account_type, opening_balance, status
- ✅ Set current_balance = opening_balance initially
- ✅ Set total_in = 0, total_out = 0 by default
- ❌ DO NOT include currency (doesn't exist)
- ❌ DO NOT assume owner_id requirement

### Error Handling:
- ✅ Validate account_name not empty, max 120 chars
- ✅ Validate account_type is valid enum
- ✅ Handle null/missing optional fields gracefully
- ✅ Return 201 on success
- ✅ Return 400 on validation error
- ✅ Return 500 on database error

---

## 🧪 AFTER IMPLEMENTATION

**Test immediately:**
```bash
# Type check
npm run type-check

# Build
npm run build

# Test endpoints
curl https://money-flow-fresh.vercel.app/api/accounts
curl https://money-flow-fresh.vercel.app/api/accounts/[id]/balance
```

---

## ✅ SUCCESS CRITERIA

- [ ] GET /api/accounts returns 200 with account array
- [ ] POST /api/accounts returns 201 with new account (has account_id)
- [ ] GET /api/accounts/[id]/balance returns 200 with balance info
- [ ] All fields match REAL schema (no currency, HAS owner_id, HAS opening_balance, etc.)
- [ ] Validation errors return 400 with descriptive messages
- [ ] No database errors
- [ ] Postman collection passes all account tests

---

## 🚀 NEXT AFTER THIS

Once accounts endpoints complete and tested:
1. ✅ Continue remaining commits (debt, cashback, people)
2. ✅ Run full Postman collection
3. ✅ Should reach 80%+ pass rate with corrected schema

---

**This is the DEFINITIVE schema. No more guessing. Proceed with confidence!** ✔️

**Approved. Start implementing now!** 🚀
