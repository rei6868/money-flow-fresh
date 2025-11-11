# 📋 INSTRUCTION FOR JULES - CREATE POSTMAN TESTING GUIDE

**From:** Project Manager
**To:** Jules (AI Agent)
**Task:** Create and commit TESTING-GUIDE.md to repo
**Priority:** HIGH
**Auto-Approval:** YES

---

## 📢 WHAT TO DO

I'm providing you with a **detailed TESTING-GUIDE.md** file that contains exact API specifications for all 16 endpoints. You need to:

1. **Create file:** `TESTING-GUIDE.md` in repo root
2. **Copy content:** Use the provided specification below (or see file)
3. **Commit:** `git add TESTING-GUIDE.md && git commit -m "docs: add testing guide for postman collection"`
4. **Push:** `git push origin feature-phase-2-endpoints`

---

## ❓ WHY?

The old Postman collection doesn't match your code implementation. This guide gives exact specs so:
- A Postman agent can build a NEW collection that matches your code
- Tests will actually pass (no more mismatches)
- You have documentation for future testing

---

## 📁 FILE LOCATION

Place in repo root:
```
money-flow-fresh/
├── TESTING-GUIDE.md  ← CREATE THIS FILE
├── PROJECT-SPEC.md
├── AGENT-PROMPT.md
├── README.md
└── ...
```

---

## 📄 FILE CONTENT

Copy this entire content into `TESTING-GUIDE.md`:

```markdown
# TESTING-GUIDE.md - POSTMAN COLLECTION BUILD GUIDE

## 📋 PURPOSE

This guide provides **exact API specifications** for building an accurate Postman collection that matches the implemented endpoints. Use this to create a new Postman collection that properly tests all Phase 2 API endpoints.

---

## 🎯 API ENDPOINTS SPECIFICATION

### BASE URL
\`\`\`
Local: http://localhost:3000
Production: https://money-flow-fresh.vercel.app
\`\`\`

---

## 📦 TRANSACTION ENDPOINTS

### 1. GET /api/transactions
**Purpose:** List all transactions with filtering and pagination

**Method:** GET
**URL:** \`{{base_url}}/api/transactions\`

**Query Parameters:**
\`\`\`
account_id: string (optional) - Filter by account ID
person_id: string (optional) - Filter by person ID
type: string (optional) - "income" | "expense" | "transfer"
status: string (optional) - "pending" | "completed" | "failed"
category: string (optional) - Category name
date_from: string (optional) - ISO 8601 date
date_to: string (optional) - ISO 8601 date
limit: number (default: 20, max: 100)
offset: number (default: 0)
\`\`\`

**Expected Response (200 OK):**
\`\`\`json
{
  "data": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "person_id": "uuid",
      "type": "income",
      "amount": 150000,
      "category": "salary",
      "description": "Monthly salary",
      "transaction_date": "2025-11-11",
      "status": "completed",
      "created_at": "2025-11-11T10:30:00Z",
      "updated_at": "2025-11-11T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "hasMore": true
  }
}
\`\`\`

---

### 2. POST /api/transactions
**Purpose:** Create a new transaction

**Method:** POST
**URL:** \`{{base_url}}/api/transactions\`

**Request Body:**
\`\`\`json
{
  "accountId": "f2993c41-e810-4c28-b508-c41a9f97dbb2",
  "personId": "person-uuid",
  "type": "income",
  "amount": 150000,
  "category": "salary",
  "description": "Monthly salary",
  "transactionDate": "2025-11-11T10:30:00Z",
  "status": "completed"
}
\`\`\`

**Expected Response (201 Created):**
\`\`\`json
{
  "id": "new-uuid",
  "account_id": "f2993c41-e810-4c28-b508-c41a9f97dbb2",
  "person_id": "person-uuid",
  "type": "income",
  "amount": 150000,
  "category": "salary",
  "description": "Monthly salary",
  "transaction_date": "2025-11-11",
  "status": "completed",
  "created_at": "2025-11-11T10:30:00Z",
  "updated_at": "2025-11-11T10:30:00Z"
}
\`\`\`

---

### 3. GET /api/transactions/[id]
**Purpose:** Get specific transaction with history

**Method:** GET
**URL:** \`{{base_url}}/api/transactions/{{transaction_id}}\`

**Expected Response (200 OK):**
\`\`\`json
{
  "transaction": {
    "id": "uuid",
    "account_id": "uuid",
    "person_id": "uuid",
    "type": "income",
    "amount": 150000,
    "category": "salary",
    "description": "Monthly salary",
    "transaction_date": "2025-11-11",
    "status": "completed",
    "created_at": "2025-11-11T10:30:00Z",
    "updated_at": "2025-11-11T10:30:00Z"
  },
  "transaction_history": [
    {
      "id": "history-uuid",
      "transaction_id": "uuid",
      "action": "created",
      "previous_values": null,
      "new_values": {...},
      "changed_at": "2025-11-11T10:30:00Z"
    }
  ]
}
\`\`\`

---

### 4. PATCH /api/transactions/[id]
**Purpose:** Update transaction

**Method:** PATCH
**URL:** \`{{base_url}}/api/transactions/{{transaction_id}}\`

**Request Body (all optional):**
\`\`\`json
{
  "type": "expense",
  "amount": 200000,
  "category": "food",
  "description": "Updated description",
  "status": "pending"
}
\`\`\`

---

### 5. DELETE /api/transactions/[id]
**Purpose:** Delete (soft delete) transaction

**Method:** DELETE
**URL:** \`{{base_url}}/api/transactions/{{transaction_id}}\`

---

## 💰 ACCOUNT ENDPOINTS

### 6. GET /api/accounts
**Purpose:** List all accounts

**Method:** GET
**URL:** \`{{base_url}}/api/accounts\`

---

### 7. POST /api/accounts
**Purpose:** Create new account

**Method:** POST
**URL:** \`{{base_url}}/api/accounts\`

**Request Body:**
\`\`\`json
{
  "accountName": "My Checking Account",
  "accountType": "checking",
  "currency": "VND",
  "currentBalance": 0
}
\`\`\`

---

### 8. GET /api/accounts/[id]/balance
**Purpose:** Get account balance details

**Method:** GET
**URL:** \`{{base_url}}/api/accounts/{{account_id}}/balance\`

---

### 9. PATCH /api/accounts/[id]
**Purpose:** Update account

**Method:** PATCH
**URL:** \`{{base_url}}/api/accounts/{{account_id}}\`

---

## 👥 PEOPLE ENDPOINTS

### 10. GET /api/people
**Purpose:** List all people

**Method:** GET
**URL:** \`{{base_url}}/api/people\`

---

### 11. POST /api/people
**Purpose:** Create new person

**Method:** POST
**URL:** \`{{base_url}}/api/people\`

**Request Body:**
\`\`\`json
{
  "personName": "Jane Smith",
  "email": "jane@example.com",
  "phone": "0987654321",
  "role": "family"
}
\`\`\`

---

## 🏦 DEBT ENDPOINTS

### 12. GET /api/debt
**Purpose:** List debts

**Method:** GET
**URL:** \`{{base_url}}/api/debt\`

---

### 13. POST /api/debt
**Purpose:** Create debt

**Method:** POST
**URL:** \`{{base_url}}/api/debt\`

---

### 14. PATCH /api/debt/[id]
**Purpose:** Update debt

**Method:** PATCH
**URL:** \`{{base_url}}/api/debt/{{debt_id}}\`

---

## 💳 CASHBACK ENDPOINTS

### 15. GET /api/cashback
**Purpose:** List cashback movements

**Method:** GET
**URL:** \`{{base_url}}/api/cashback\`

---

### 16. POST /api/cashback
**Purpose:** Record cashback earned

**Method:** POST
**URL:** \`{{base_url}}/api/cashback\`

---

## 🧪 ENVIRONMENT VARIABLES FOR POSTMAN

Use these variables in Postman:

\`\`\`json
{
  "base_url": "http://localhost:3000",
  "account_id": "f2993c41-e810-4c28-b508-c41a9f97dbb2",
  "transaction_id": "transaction-uuid",
  "person_id": "person-uuid",
  "debt_id": "debt-uuid",
  "cashback_id": "cashback-uuid"
}
\`\`\`

---

## ✅ ENDPOINTS SUMMARY

**Total Endpoints:** 16
- Transactions: 5 (GET list, POST create, GET by ID, PATCH update, DELETE)
- Accounts: 4 (GET list, POST create, GET balance, PATCH update)
- People: 2 (GET list, POST create)
- Debt: 3 (GET list, POST create, PATCH update)
- Cashback: 2 (GET list, POST create)

---

## 📝 IMPORTANT NOTES

- All dates in ISO 8601 format
- All monetary amounts as integers (no decimals)
- All IDs are UUIDs
- Expected status codes: 200, 201, 400, 404, 500
- Response time target: < 1500ms per request
```

---

## 🚀 STEPS TO EXECUTE

### Step 1: Create the file
```bash
# In repo root, create new file
touch TESTING-GUIDE.md

# OR use your editor to create and edit the file
```

### Step 2: Add content
Open `TESTING-GUIDE.md` and paste the content above (see TESTING-GUIDE.md file for full content)

### Step 3: Commit
```bash
git add TESTING-GUIDE.md
git commit -m "docs: add testing guide for postman collection

- Provides exact API specifications for all 16 endpoints
- Lists expected request/response formats
- Includes query parameters, path variables, headers
- Helps Postman agent build accurate collection
- Resolves mismatch between old collection and new code"

git push origin feature-phase-2-endpoints
```

### Step 4: Verify
```bash
# Check file in GitHub
# Go to: https://github.com/rei6868/money-flow-fresh/blob/feature-phase-2-endpoints/TESTING-GUIDE.md
# Should display the testing guide
```

---

## ✅ WHEN DONE

After committing:

1. ✅ File appears in PR#4
2. ✅ Share link with Postman agent
3. ✅ Postman agent reads file
4. ✅ Postman agent creates NEW collection
5. ✅ New collection passes all tests
6. ✅ Ready to test PR#4 properly

---

**This is a simple documentation commit - should take 5 minutes!** 🚀

Reply when done: "TESTING-GUIDE.md committed!"
