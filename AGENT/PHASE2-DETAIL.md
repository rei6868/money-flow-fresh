# PHASE 2 COMPLETION - DETAILED ENDPOINT SPECIFICATIONS

## 📋 OVERVIEW

**Status:** Phase 2 vừa merge PR3 ✅, nhưng API còn 50% incomplete
- ✅ Merged: `GET /api/accounts`, `GET /api/transactions` (partial)
- ❌ Missing: 14 endpoints (POST/PATCH/DELETE for transactions, accounts, debt, cashback, people)

**Task:** Implement remaining 14 endpoints theo danh sách dưới đây

**Time:** 6-8 hours
**Output:** 14 commits, 100% Postman collection pass

---

## 🎯 ENDPOINTS TO IMPLEMENT (14 TOTAL)

### **GROUP 1: TRANSACTIONS (5 endpoints)**

#### Commit 7: POST /api/transactions
```typescript
// File: src/app/api/transactions/route.ts - ADD THIS HANDLER

POST /api/transactions

Request Body:
{
  "accountId": "uuid-string",
  "personId": "uuid-string",
  "type": "income|expense|transfer",
  "amount": 150000,
  "category": "salary|food|transport|etc",
  "description": "Monthly salary",
  "transactionDate": "2025-11-11T10:30:00Z",
  "status": "pending|completed|failed"
}

Response (201 Created):
{
  "id": "new-uuid",
  "accountId": "uuid",
  "personId": "uuid",
  "type": "income",
  "amount": 150000,
  "category": "salary",
  "description": "Monthly salary",
  "transactionDate": "2025-11-11T10:30:00Z",
  "status": "completed",
  "createdAt": "2025-11-11T10:30:00Z",
  "updatedAt": "2025-11-11T10:30:00Z"
}

Requirements:
- Validate all fields with Zod
- Check accountId exists in database
- Recalculate account balance AFTER transaction inserted
- Use transaction timestamp NOT current time
- Handle different transaction types (income/expense/transfer)
- Ensure amount > 0
- Return 400 if validation fails
- Return 404 if account not found
- Return 201 with created transaction on success
```

#### Commit 8: PATCH /api/transactions/[id]
```typescript
// File: src/app/api/transactions/[id]/route.ts - ADD PATCH HANDLER

PATCH /api/transactions/[id]

Request Body (all optional):
{
  "type": "income|expense|transfer",
  "amount": 200000,
  "category": "salary",
  "description": "Updated description",
  "status": "pending|completed|failed"
}

Response (200 OK):
{
  "id": "uuid",
  "accountId": "uuid",
  "updatedFields": ["amount", "status"],
  "newValues": {
    "amount": 200000,
    "status": "completed"
  }
}

Requirements:
- Only update provided fields
- Recalculate balance if amount changed
- Validate new values with Zod
- Return 404 if transaction not found
- Return 400 if validation fails
- Return 200 with updated data on success
```

#### Commit 9: DELETE /api/transactions/[id]
```typescript
// File: src/app/api/transactions/[id]/route.ts - ADD DELETE HANDLER

DELETE /api/transactions/[id]

Response (200 OK):
{
  "message": "Transaction deleted successfully",
  "id": "uuid",
  "reversedBalance": 150000
}

Requirements:
- Soft delete: set deleted_at = NOW()
- Reverse the transaction impact on account balance
- If was income: subtract from balance
- If was expense: add back to balance
- Return 404 if already deleted
- Return 200 on success
```

#### Commit 10: GET /api/transactions with advanced filters
```typescript
// File: src/app/api/transactions/route.ts - ENHANCE EXISTING

GET /api/transactions?account_id=uuid&type=income&status=completed&limit=20&offset=0

Query Params:
- account_id (optional): Filter by account
- person_id (optional): Filter by person
- type (optional): income|expense|transfer
- status (optional): pending|completed|failed
- category (optional): salary|food|transport|etc
- date_from (optional): ISO 8601 date
- date_to (optional): ISO 8601 date
- limit (default: 20, max: 100)
- offset (default: 0)

Response (200 OK):
{
  "data": [
    {
      "id": "uuid",
      "accountId": "uuid",
      "personId": "uuid",
      "type": "income",
      "amount": 150000,
      "category": "salary",
      "description": "Monthly salary",
      "transactionDate": "2025-11-11",
      "status": "completed",
      "createdAt": "2025-11-11T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "hasMore": true
  }
}

Requirements:
- Apply all filters efficiently
- Sort by transactionDate DESC (newest first)
- Implement proper pagination
- Handle date range filtering
- Validate limit <= 100
- Return 200 with data
```

#### Commit 11: GET /api/transactions/[id] with full history
```typescript
// File: src/app/api/transactions/[id]/route.ts - ADD GET HANDLER

GET /api/transactions/[id]

Response (200 OK):
{
  "transaction": {
    "id": "uuid",
    "accountId": "uuid",
    "personId": "uuid",
    "type": "income",
    "amount": 150000,
    "category": "salary",
    "description": "Monthly salary",
    "transactionDate": "2025-11-11",
    "status": "completed",
    "createdAt": "2025-11-11T10:30:00Z",
    "updatedAt": "2025-11-11T10:30:00Z"
  },
  "transactionHistory": [
    {
      "id": "history-uuid",
      "transactionId": "uuid",
      "action": "created|updated|deleted",
      "previousValues": {...},
      "newValues": {...},
      "changedBy": "user-id",
      "changedAt": "2025-11-11T10:30:00Z"
    }
  ]
}

Requirements:
- Fetch transaction details
- Include transaction_history records (previous edits)
- Return 404 if not found
- Return 200 with full history on success
```

---

### **GROUP 2: ACCOUNTS (3 endpoints)**

#### Commit 12: POST /api/accounts (FIX)
```typescript
// File: src/app/api/accounts/route.ts - FIX EXISTING POST HANDLER

POST /api/accounts

Request Body:
{
  "accountName": "My Savings",
  "accountType": "savings|checking|investment|credit",
  "currency": "VND|USD|EUR",
  "currentBalance": 0
}

Response (201 Created):
{
  "accountId": "new-uuid",
  "accountName": "My Savings",
  "accountType": "savings",
  "currentBalance": 0,
  "currency": "VND",
  "status": "active",
  "createdAt": "2025-11-11T10:30:00Z"
}

Requirements:
- Use EXACT column names from database (check schema)
- Validate: account_name is string, max 80 chars
- Validate: account_type is ENUM (savings|checking|investment|credit)
- Validate: current_balance >= 0
- Validate: currency is valid (VND, USD, EUR)
- Return 400 if validation fails
- Return 201 with created account
- FIX: Remove any person_id or owner_id - NOT in schema
```

#### Commit 13: GET /api/accounts/[id]/balance
```typescript
// File: src/app/api/accounts/[id]/balance/route.ts - IMPLEMENT

GET /api/accounts/[id]/balance

Response (200 OK):
{
  "accountId": "uuid",
  "currentBalance": 5000000,
  "currency": "VND",
  "totalIncome": 10000000,
  "totalExpense": 5000000,
  "status": "active",
  "lastUpdated": "2025-11-11T10:30:00Z"
}

Requirements:
- Get account details
- Calculate totalIncome from all income transactions
- Calculate totalExpense from all expense transactions
- Return currentBalance from accounts table
- Verify balance = totalIncome - totalExpense
- Return 404 if account not found
- Return 200 with balance details
```

#### Commit 14: PATCH /api/accounts/[id]
```typescript
// File: src/app/api/accounts/[id]/route.ts - FIX EXISTING

PATCH /api/accounts/[id]

Request Body (optional fields):
{
  "accountName": "New Name",
  "accountType": "checking",
  "status": "active|inactive|closed"
}

Response (200 OK):
{
  "accountId": "uuid",
  "updatedFields": ["accountName", "status"],
  "account": {
    "accountName": "New Name",
    "accountType": "checking",
    "status": "active",
    "currentBalance": 5000000,
    "updatedAt": "2025-11-11T10:30:00Z"
  }
}

Requirements:
- Only update provided fields
- Validate new values
- DO NOT allow updating currentBalance (only via transactions)
- Return 404 if not found
- Return 400 if validation fails
- Return 200 with updated account
```

---

### **GROUP 3: DEBT (3 endpoints)**

#### Commit 15: GET /api/debt
```typescript
// File: src/app/api/debt/route.ts

GET /api/debt?account_id=uuid&status=active&limit=20&offset=0

Query Params:
- account_id (optional): Filter by account
- person_id (optional): Filter by creditor
- status (optional): active|settled|overdue
- limit (default: 20)
- offset (default: 0)

Response (200 OK):
{
  "data": [
    {
      "debtId": "uuid",
      "debtorAccountId": "uuid",
      "creditorPersonId": "uuid",
      "amount": 5000000,
      "reason": "Loan from friend",
      "dueDate": "2025-12-11",
      "status": "active",
      "createdAt": "2025-11-11"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 10,
    "hasMore": false
  }
}

Requirements:
- Fetch from debt_ledger table
- Apply filters
- Sort by dueDate ASC
- Return 200
```

#### Commit 16: POST /api/debt
```typescript
// File: src/app/api/debt/route.ts

POST /api/debt

Request Body:
{
  "debtorAccountId": "uuid",
  "creditorPersonId": "uuid",
  "amount": 5000000,
  "reason": "Loan from friend",
  "dueDate": "2025-12-11"
}

Response (201 Created):
{
  "debtId": "new-uuid",
  "debtorAccountId": "uuid",
  "creditorPersonId": "uuid",
  "amount": 5000000,
  "reason": "Loan from friend",
  "dueDate": "2025-12-11",
  "status": "active",
  "createdAt": "2025-11-11"
}

Requirements:
- Validate all fields
- Check account and person exist
- Validate amount > 0
- Create entry in debt_ledger
- Return 201
```

#### Commit 17: PATCH /api/debt/[id]
```typescript
// File: src/app/api/debt/[id]/route.ts

PATCH /api/debt/[id]

Request Body:
{
  "amount": 6000000,
  "status": "settled|active|overdue"
}

Response (200 OK):
{
  "debtId": "uuid",
  "updatedFields": ["amount", "status"],
  "debt": {
    "amount": 6000000,
    "status": "settled"
  }
}

Requirements:
- Update debt details
- If status='settled', create debt_movement record
- Return 200
```

---

### **GROUP 4: CASHBACK (2 endpoints)**

#### Commit 18: GET /api/cashback
```typescript
// File: src/app/api/cashback/route.ts

GET /api/cashback?account_id=uuid&month=2025-11

Response (200 OK):
{
  "data": [
    {
      "cashbackId": "uuid",
      "accountId": "uuid",
      "category": "food",
      "amount": 500000,
      "rate": 0.05,
      "earnedFrom": "dining_category",
      "earnedDate": "2025-11-11",
      "status": "pending|credited"
    }
  ],
  "summary": {
    "totalEarned": 2000000,
    "totalPending": 500000,
    "totalCredited": 1500000
  }
}

Requirements:
- Fetch from cashback_movements table
- Filter by account and month
- Calculate totals
- Return 200
```

#### Commit 19: POST /api/cashback
```typescript
// File: src/app/api/cashback/route.ts

POST /api/cashback

Request Body:
{
  "accountId": "uuid",
  "category": "food",
  "amount": 500000,
  "rate": 0.05,
  "earnedFrom": "dining_category"
}

Response (201 Created):
{
  "cashbackId": "new-uuid",
  "accountId": "uuid",
  "category": "food",
  "amount": 500000,
  "rate": 0.05,
  "status": "pending",
  "earnedDate": "2025-11-11"
}

Requirements:
- Validate all fields
- Create cashback_movement record
- Return 201
```

---

### **GROUP 5: PEOPLE (1 endpoint)**

#### Commit 20: GET /api/people
```typescript
// File: src/app/api/people/route.ts

GET /api/people?limit=20&offset=0

Response (200 OK):
{
  "data": [
    {
      "personId": "uuid",
      "personName": "John Doe",
      "email": "john@example.com",
      "phone": "0123456789",
      "role": "friend|family|colleague|other",
      "createdAt": "2025-01-01"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 50,
    "hasMore": true
  }
}

Requirements:
- Fetch from people table
- Paginate results
- Sort by createdAt DESC
- Return 200
```

---

## ✅ CHECKLIST BEFORE CODING

- [ ] Read full PROJECT-SPEC.md for database schema
- [ ] Understand all table relationships
- [ ] Confirm validation rules from DB constraints
- [ ] Verify enum values match database
- [ ] Check Next.js 15 params type (must await)
- [ ] Plan transaction handling (especially balance recalculation)

---

## 🧪 TESTING AFTER EACH COMMIT

After implementing each endpoint:

```bash
# Test locally
npm run dev

# Use Postman collection to test
1. Import: Money-Flow-API-v1.postman_collection.json
2. Run collection
3. Check all tests pass for that endpoint
4. If fail, debug and fix
5. Commit when passing
```

---

## 📝 COMMIT MESSAGE FORMAT

```
git commit -m "feat: implement POST /api/transactions endpoint

- Create new transaction with validation
- Recalculate account balance
- Handle income/expense/transfer types
- Return 201 with created transaction
- Handle errors: validation, not found

Tests: All Postman tests passing"
```

---

## 🚀 SUCCESS CRITERIA

✅ All 14 endpoints implemented
✅ All 39+ Postman tests pass (100%)
✅ No TypeScript errors
✅ Vercel build succeeds
✅ API is production-ready

---

## 🆘 IF STUCK

**Schema errors?** → Check PROJECT-SPEC.md for exact column names
**Validation errors?** → Check validation.ts for Zod schemas
**Params type error?** → Remember: `params: Promise<{ id: string }>` then `await params`
**Database errors?** → Verify table exists on Neon: SELECT * FROM {table_name};
**Need help?** → Ask me with exact error message
