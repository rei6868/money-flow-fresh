# PR3 Fix: Next.js 15 params Type Error

## 🔴 Vấn Đề Hiện Tại

**Error trên Vercel:**
```
Type error: Type 'typeof import("/vercel/path0/src/app/api/accounts/[id]/balance/route")' 
does not satisfy the constraint 'RouteHandlerConfig<"/api/accounts/[id]/balance">'.
  Types of property 'GET' are incompatible.
    Type '(request: Request, { params }: { params: { id: string; } }) => Promise<Response>' 
    is not assignable to type '(request: NextRequest, context: { params: Promise<{ id: string; }>; }) => void | Response | Promise<void | Response>'.
```

**Nguyên Nhân:** 
- Next.js 14 → Next.js 15 thay đổi: `params` từ `{ id: string }` thành `Promise<{ id: string }>`
- Tất cả dynamic routes `[id]` phải **await params** trước khi sử dụng

---

## ✅ Giải Pháp: Fix PR3 Code

### **Bước 1: Update tất cả dynamic route handlers**

**File cần sửa:**
- `src/app/api/accounts/[id]/balance/route.ts`
- `src/app/api/accounts/[id]/route.ts` (PATCH & DELETE)

### **Bước 2: Pattern để fix**

#### ❌ OLD (Next.js 14 - WRONG)
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const accountId = params.id;
  // ... rest of code
}
```

#### ✅ NEW (Next.js 15 - CORRECT)
```typescript
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ⭐ AWAIT params đầu tiên
  const { id } = await params;
  
  // ... rest of code sử dụng id
}
```

---

## 📋 Chi Tiết Fix cho từng Endpoint

### **1. GET /api/accounts/[id]/balance**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@neon-serverless/neon-serverless';
import { calculateAccountBalance } from '@/utils/calculations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ⭐ AWAIT params
    const { id: accountId } = await params;

    // Validate accountId
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Get account từ database
    const account = await sql`
      SELECT * FROM accounts WHERE account_id = ${accountId}
    `;

    if (account.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Calculate balance
    const balance = await calculateAccountBalance(accountId);

    return NextResponse.json({
      accountId,
      balance,
      currency: account[0].currency,
    });
  } catch (error) {
    console.error('Error getting account balance:', error);
    return NextResponse.json(
      { error: 'Failed to get account balance' },
      { status: 500 }
    );
  }
}
```

---

### **2. PATCH /api/accounts/[id]**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@neon-serverless/neon-serverless';
import { accountUpdateSchema } from '@/lib/validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ⭐ AWAIT params
    const { id: accountId } = await params;

    // Validate accountId
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Parse body
    const body = await request.json();
    
    // Validate input
    const validatedData = accountUpdateSchema.parse(body);

    // Check if account exists
    const existingAccount = await sql`
      SELECT * FROM accounts WHERE account_id = ${accountId}
    `;

    if (existingAccount.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Update account
    const updated = await sql`
      UPDATE accounts 
      SET 
        account_name = ${validatedData.accountName || existingAccount[0].account_name},
        account_type = ${validatedData.accountType || existingAccount[0].account_type},
        current_balance = ${validatedData.currentBalance ?? existingAccount[0].current_balance},
        status = ${validatedData.status || existingAccount[0].status},
        updated_at = NOW()
      WHERE account_id = ${accountId}
      RETURNING *
    `;

    return NextResponse.json(
      { message: 'Account updated successfully', account: updated[0] },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error updating account:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}
```

---

### **3. DELETE /api/accounts/[id]**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@neon-serverless/neon-serverless';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ⭐ AWAIT params
    const { id: accountId } = await params;

    // Validate accountId
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Check if account exists
    const existingAccount = await sql`
      SELECT * FROM accounts WHERE account_id = ${accountId}
    `;

    if (existingAccount.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Soft delete - update status to 'closed'
    await sql`
      UPDATE accounts 
      SET 
        status = 'closed',
        updated_at = NOW()
      WHERE account_id = ${accountId}
    `;

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
```

---

## 🔑 Key Changes Summary

| Thay Đổi | Before | After |
|---------|--------|-------|
| **Import** | `Request` | `NextRequest` |
| **params type** | `{ params: { id: string } }` | `{ params: Promise<{ id: string }> }` |
| **Access params** | `const id = params.id;` | `const { id } = await params;` |
| **First step** | Start logic | ⭐ Always `await params` first |

---

## ✋ MUST-DO Checklist

- [ ] Import `NextRequest` từ `next/server` cho tất cả dynamic routes
- [ ] Add `await params` ở đầu mỗi route handler
- [ ] Destructure: `const { id } = await params`
- [ ] Test cục bộ: `npm run dev` → truy cập `/api/accounts/test-id/balance`
- [ ] Verify TypeScript: `npm run type-check` → 0 errors
- [ ] Deploy: `git commit -m "fix: next.js 15 params type error"` → `git push`

---

## 🚀 Kết Quả Kỳ Vọng

Sau khi apply fix:
- ✅ TypeScript errors → 0
- ✅ Vercel build → pass
- ✅ Dynamic routes → work correctly
- ✅ API endpoints → functional

---

## 📝 Notes

- Này là **standard Next.js 15 pattern** - cần apply cho **TẤT CẢ dynamic routes**
- Nếu có route khác như `/api/transactions/[id]`, `/api/debt/[id]` → cũng phải fix giống vậy
- `await params` là **bắt buộc** trong Next.js 15 trở lên

Ready to implement! 🎯
