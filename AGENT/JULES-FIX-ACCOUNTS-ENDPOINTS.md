# 🚀 JULES - FIX ACCOUNTS ENDPOINTS (AUTO-APPROVED)

> Copy entire content và paste vào Jules. AUTO-APPROVED. Chỉ cần thực thi.

---

## ✅ AUTO-APPROVED PLAN

**This plan is 100% approved. Go ahead with full confidence. All schema verified against production Neon database.**

---

## 🎯 CRITICAL: READ THIS FIRST

### Previous Issues (NOW FIXED):
- ❌ Schema mismatch - Agent was using wrong schema
- ❌ Missing fields: `opening_balance`, `total_in`, `total_out`, `owner_id`, etc.
- ❌ Wrong field names and types

### Solution:
- ✅ **DEFINITIVE schema verified** from Neon production database
- ✅ All field names, types, nullable status - CORRECT
- ✅ This is NOT a guess - this is the REAL schema

---

## 📌 REFERENCE FILES (READ THESE)

**Before coding, read these files from the repo:**
1. **ACCOUNTS-SCHEMA-CORRECTED.md** - THE DEFINITIVE SCHEMA (you MUST follow this exactly)
2. **PROJECT-SPEC.md** - Business logic context
3. **AGENT-PROMPT.md** - Implementation guide

---

## 🎯 TASK: Fix & Complete Accounts API Endpoints

**Status:** Previous attempts failed due to schema mismatch - NOW FIXED  
**Current:** Only partially implemented, many bugs due to wrong schema  
**Goal:** Implement ALL accounts endpoints correctly matching REAL schema

---

## 🔴 DEFINITIVE ACCOUNTS TABLE SCHEMA

**DO NOT GUESS! THIS IS FROM NEON PRODUCTION:**

```sql
CREATE TABLE "public"."accounts" (
    "account_id" varchar(36) PRIMARY KEY NOT NULL,
    "account_name" varchar(120) NOT NULL,          -- MAX 120, NOT 80!
    "img_url" text,
    "account_type" account_type NOT NULL,
    "owner_id" varchar(36),                        -- NULLABLE, OPTIONAL
    "parent_account_id" varchar(36),               -- NULLABLE
    "asset_ref" varchar(36),                       -- NULLABLE
    "opening_balance" numeric(18,2) NOT NULL,      -- ⭐ MUST PROVIDE
    "current_balance" numeric(18,2) NOT NULL,      -- ⭐ MUST PROVIDE
    "status" account_status NOT NULL,
    "total_in" numeric(18,2) NOT NULL DEFAULT 0,
    "total_out" numeric(18,2) NOT NULL DEFAULT 0,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "notes" text
);
```

**Key differences from previous schema:**
- ❌ NO `currency` field (delete it)
- ❌ NO `person_id` field (use `owner_id` instead)
- ✅ `opening_balance` - MUST provide when creating
- ✅ `total_in`, `total_out` - track sums
- ✅ `owner_id` - still exists (nullable)
- ✅ `parent_account_id` - for hierarchy
- ✅ `asset_ref` - link to assets

---

## 📝 COMMIT: POST /api/accounts (Fix & Complete)

**File:** `src/app/api/accounts/route.ts` (UPDATE existing)

**Current issue:** Missing fields, wrong schema

**Fix:**

```typescript
import { z } from 'zod';
import { queryOne, execute, queryMany } from '@/lib/db';
import { CreateAccountSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. VALIDATE INPUT against CreateAccountSchema
    const validInput = CreateAccountSchema.parse(body);

    // 2. VERIFY account_type is valid enum
    const validTypes = ['checking', 'savings', 'credit', 'investment', 'wallet'];
    if (!validTypes.includes(validInput.account_type)) {
      return Response.json(
        { error: 'Invalid account_type' },
        { status: 400 }
      );
    }

    // 3. VERIFY status is valid enum
    const validStatuses = ['active', 'inactive', 'closed', 'suspended'];
    if (validInput.status && !validStatuses.includes(validInput.status)) {
      return Response.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // 4. GENERATE account ID
    const accountId = crypto.randomUUID();

    // 5. BUILD INSERT query with ALL fields from REAL schema
    const insertQuery = `
      INSERT INTO accounts (
        account_id,
        account_name,
        img_url,
        account_type,
        owner_id,
        parent_account_id,
        asset_ref,
        opening_balance,
        current_balance,
        status,
        total_in,
        total_out,
        notes,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
      )
      RETURNING *
    `;

    // 6. PREPARE parameters in correct order
    const params = [
      accountId,
      validInput.account_name,
      validInput.img_url || null,
      validInput.account_type,
      validInput.owner_id || null,
      validInput.parent_account_id || null,
      validInput.asset_ref || null,
      validInput.opening_balance || 0,
      validInput.current_balance || validInput.opening_balance || 0,
      validInput.status || 'active',
      validInput.total_in || 0,
      validInput.total_out || 0,
      validInput.notes || null
    ];

    // 7. EXECUTE insert
    const newAccount = await queryOne(insertQuery, params);

    if (!newAccount) {
      return Response.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // 8. RETURN created account
    return Response.json(newAccount, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      );
    }
    console.error('[POST /api/accounts]', error);
    return Response.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
```

---

## 📝 COMMIT: UPDATE GET /api/accounts (Fix)

**File:** `src/app/api/accounts/route.ts` (UPDATE GET method)

**Current issue:** Missing nullable fields

**Fix:**

```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner_id = searchParams.get('owner_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // BUILD query with filters
    let query = 'SELECT * FROM accounts WHERE 1=1';
    const params: any[] = [];

    if (owner_id) {
      query += ' AND owner_id = $' + (params.length + 1);
      params.push(owner_id);
    }

    // PAGINATION
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    // FETCH accounts
    const accounts = await queryMany(query, params);

    return Response.json({
      data: accounts,
      limit,
      offset
    });

  } catch (error) {
    console.error('[GET /api/accounts]', error);
    return Response.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
```

---

## 📝 COMMIT: GET /api/accounts/[id]/balance (Fix)

**File:** `src/app/api/accounts/[id]/balance/route.ts` (CREATE NEW)

**Purpose:** Return account balance info

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. GET account
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

    // 2. RETURN balance info
    return Response.json({
      account_id: params.id,
      account_name: account.account_name,
      account_type: account.account_type,
      opening_balance: account.opening_balance,
      current_balance: account.current_balance,
      total_in: account.total_in,
      total_out: account.total_out,
      status: account.status,
      as_of_date: new Date().toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('[GET /api/accounts/[id]/balance]', error);
    return Response.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
```

---

## 📝 COMMIT: PATCH /api/accounts/[id] (Create)

**File:** `src/app/api/accounts/[id]/route.ts` (UPDATE - add PATCH method)

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // 1. GET old account
    const oldAccount = await queryOne(
      'SELECT * FROM accounts WHERE account_id = $1',
      [params.id]
    );

    if (!oldAccount) {
      return Response.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // 2. BUILD dynamic UPDATE
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    // Update only provided fields
    if (body.account_name !== undefined) {
      updateFields.push(`account_name = $${paramIndex++}`);
      updateParams.push(body.account_name);
    }
    if (body.account_type !== undefined) {
      updateFields.push(`account_type = $${paramIndex++}`);
      updateParams.push(body.account_type);
    }
    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateParams.push(body.status);
    }
    if (body.owner_id !== undefined) {
      updateFields.push(`owner_id = $${paramIndex++}`);
      updateParams.push(body.owner_id || null);
    }
    if (body.current_balance !== undefined) {
      updateFields.push(`current_balance = $${paramIndex++}`);
      updateParams.push(body.current_balance);
    }
    if (body.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      updateParams.push(body.notes);
    }

    updateFields.push(`updated_at = NOW()`);
    updateParams.push(params.id);

    const updateQuery = `UPDATE accounts SET ${updateFields.join(', ')} WHERE account_id = $${paramIndex} RETURNING *`;
    const updatedAccount = await queryOne(updateQuery, updateParams);

    return Response.json(updatedAccount);

  } catch (error) {
    console.error('[PATCH /api/accounts/[id]]', error);
    return Response.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}
```

---

## 📝 COMMIT: DELETE /api/accounts/[id] (Create)

**File:** `src/app/api/accounts/[id]/route.ts` (UPDATE - add DELETE method)

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    // Soft delete: set status to closed
    await execute(
      'UPDATE accounts SET status = $1, updated_at = NOW() WHERE account_id = $2',
      ['closed', params.id]
    );

    return Response.json({ success: true, message: 'Account closed' });

  } catch (error) {
    console.error('[DELETE /api/accounts/[id]]', error);
    return Response.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
```

---

## 🧪 TESTING AFTER EACH COMMIT

```bash
# After each commit, test immediately:

# 1. Type check
npm run type-check

# 2. Test POST (create)
curl -X POST https://money-flow-fresh.vercel.app/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "account_name": "Test Account",
    "account_type": "checking",
    "opening_balance": 1000,
    "current_balance": 1000,
    "status": "active"
  }'

# Should return: 201 Created with account_id

# 3. Test GET (list)
curl https://money-flow-fresh.vercel.app/api/accounts

# 4. Test GET balance
curl https://money-flow-fresh.vercel.app/api/accounts/{id}/balance
```

---

## ✅ SUCCESS CRITERIA

After all commits:
- [ ] POST /api/accounts returns 201 Created
- [ ] GET /api/accounts returns 200 OK with accounts
- [ ] GET /api/accounts/[id]/balance returns 200 OK
- [ ] PATCH /api/accounts/[id] returns 200 OK
- [ ] DELETE /api/accounts/[id] returns 200 OK
- [ ] All fields match ACCOUNTS-SCHEMA-CORRECTED.md
- [ ] No database constraint violations
- [ ] Postman collection runs without errors

---

## 🚨 CRITICAL REMINDERS

✅ DO:
- Follow ACCOUNTS-SCHEMA-CORRECTED.md EXACTLY
- Provide ALL NOT NULL fields when creating
- Handle nullable fields properly
- Test after each commit
- Use parameterized queries

❌ DON'T:
- Use `currency` field (doesn't exist)
- Use `person_id` field (use `owner_id` instead)
- Forget `opening_balance` (NOT NULL!)
- Forget `current_balance` (NOT NULL!)
- Assume `account_name` max 80 chars (it's 120!)

---

## ✅ THIS PLAN IS 100% APPROVED

**All schema verified against production Neon database.**  
**Go ahead with full confidence. No more schema issues!**

**Proceed immediately!** 🚀
