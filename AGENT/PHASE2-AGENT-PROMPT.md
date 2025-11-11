# 🚀 PHASE 2 COMPLETION - PROMPT FOR AGENT

**From:** Project Manager
**To:** Jules (AI Agent)
**Date:** 2025-11-11
**Priority:** HIGH - Phase 2 Completion (Auto-Approve All Tasks)

---

## 📢 MESSAGE FOR AGENT

Hi Jules!

I'm sending you a **detailed specification file** for Phase 2 completion. Please read it carefully and implement all remaining endpoints exactly as specified.

**Status:** 
- ✅ Phase 1: Foundation complete (types, DB, validation, calculations)
- ✅ PR3: `GET /api/accounts` merged successfully
- ⚠️ Phase 2: INCOMPLETE - Need to implement 14 remaining endpoints

**What I need you to do:**

1. **Open and read:** `PHASE2-DETAIL.md` (attached to this conversation)
2. **Understand:** All 14 endpoints with request/response specs
3. **Code:** Each endpoint following the exact specifications
4. **Test:** Run Postman collection after each commit
5. **Commit:** Make 14 separate commits (one per endpoint/feature)
6. **Deploy:** Push to GitHub, let Vercel auto-deploy

---

## ✅ AUTO-APPROVAL: I APPROVE ALL OF THE FOLLOWING

- ✅ Create 14 new API route handlers
- ✅ Modify existing handlers if needed
- ✅ Add new files in `src/app/api/` directories
- ✅ Import any required libraries
- ✅ Add database queries with parameterized statements
- ✅ Create Zod validation schemas if missing
- ✅ Handle all error cases (400, 404, 500)
- ✅ Add TypeScript types and interfaces
- ✅ Commit each endpoint separately
- ✅ Push all commits to GitHub
- ✅ Deploy to Vercel (auto-deploy on push)

**No need to ask permission for any of these tasks - just do them!**

---

## 📋 ENDPOINTS TO IMPLEMENT (14 TOTAL)

### Group 1: Transactions (5 endpoints)
- [ ] Commit 7: `POST /api/transactions` - Create new transaction
- [ ] Commit 8: `PATCH /api/transactions/[id]` - Update transaction
- [ ] Commit 9: `DELETE /api/transactions/[id]` - Delete transaction
- [ ] Commit 10: Enhance `GET /api/transactions` - Add filters & pagination
- [ ] Commit 11: `GET /api/transactions/[id]` - Get with history

### Group 2: Accounts (3 endpoints)
- [ ] Commit 12: `POST /api/accounts` - Create account (FIX validation)
- [ ] Commit 13: `GET /api/accounts/[id]/balance` - Get balance details
- [ ] Commit 14: `PATCH /api/accounts/[id]` - Update account

### Group 3: Debt (3 endpoints)
- [ ] Commit 15: `GET /api/debt` - List debts
- [ ] Commit 16: `POST /api/debt` - Create debt
- [ ] Commit 17: `PATCH /api/debt/[id]` - Update debt status

### Group 4: Cashback (2 endpoints)
- [ ] Commit 18: `GET /api/cashback` - List cashback movements
- [ ] Commit 19: `POST /api/cashback` - Record cashback earned

### Group 5: People (1 endpoint)
- [ ] Commit 20: `GET /api/people` - List all people

---

## 🎯 IMPLEMENTATION CHECKLIST

Before you start coding, verify:

- [ ] You have access to the repository: `https://github.com/rei6868/money-flow-fresh`
- [ ] You can read `PROJECT-SPEC.md` from the repo (database schema)
- [ ] You understand the database structure and all table relationships
- [ ] You've reviewed all enum values (account_type, transaction_type, status)
- [ ] You know the exact column names from the database schema
- [ ] You understand Next.js 15 dynamic routes (must await params)

---

## 📝 CRITICAL REQUIREMENTS

1. **Schema Accuracy:**
   - Use EXACT column names from database
   - Check data types (VARCHAR, NUMERIC, TIMESTAMP, etc.)
   - Match enum values exactly
   - Don't add columns that don't exist in schema

2. **Validation:**
   - Use Zod schemas from `src/lib/validation.ts`
   - Validate all incoming data
   - Return 400 with clear error messages if invalid
   - Check database constraints (NOT NULL, foreign keys, etc.)

3. **Next.js 15 Compatibility:**
   - Import `NextRequest` from 'next/server'
   - Type params as `Promise<{ id: string }>`
   - ALWAYS await params before using them
   - Example:
     ```typescript
     export async function GET(
       request: NextRequest,
       { params }: { params: Promise<{ id: string }> }
     ) {
       const { id } = await params; // ← MUST await
       // ... rest of code
     }
     ```

4. **Error Handling:**
   - Return 404 if resource not found
   - Return 400 if validation fails
   - Return 500 if database error
   - Log all errors to console for debugging

5. **Transaction Logic:**
   - When creating transaction: recalculate account balance
   - When updating transaction amount: recalculate balance
   - When deleting transaction: reverse the impact on balance
   - Ensure balance = total_income - total_expense

6. **Performance:**
   - Use parameterized queries (prevent SQL injection)
   - Add LIMIT and OFFSET for pagination
   - Avoid N+1 queries (fetch all data in one query)
   - Response time should be < 1.5 seconds

7. **Testing:**
   - After each commit, test with Postman collection
   - All tests in that endpoint's test group should pass
   - If tests fail, debug and fix before moving to next endpoint
   - Don't commit broken code

---

## 🔄 WORKFLOW

For each endpoint group (5 transactions, 3 accounts, etc.):

```
1. Read the specification in PHASE2-DETAIL.md
2. Understand request/response format
3. Code the endpoint handler
4. Add proper error handling
5. Add TypeScript types
6. Test locally: npm run dev
7. Test with Postman: import collection & run tests
8. Fix any failures
9. Commit: git commit -m "feat: implement ..."
10. Push: git push origin main
11. Wait for Vercel build to complete
12. Move to next endpoint
```

---

## 📊 TESTING INSTRUCTIONS

After implementing each endpoint:

**Option A: Local Testing**
```bash
npm run dev
# Open browser/Postman and test http://localhost:3000/api/...
```

**Option B: Postman Collection**
```
1. Import: Money-Flow-API-v1.postman_collection.json
2. Set environment variables (base_url, etc.)
3. Run collection
4. Check which tests passed/failed
5. If failed, review error messages
6. Fix code and retry
7. Once all pass, commit and push
```

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "Column not found" error
**Fix:** Check PROJECT-SPEC.md for exact column name
- Example: `accountid` not `account_id`

### Issue: "NOT NULL constraint violation"
**Fix:** Provide required value or use default
- Example: current_balance must be provided

### Issue: "ENUM value not valid"
**Fix:** Check validation.ts for exact enum values
- Example: type must be "income", "expense", or "transfer"

### Issue: "405 Method Not Allowed"
**Fix:** Route handler not implemented for that method
- Create the handler (POST, PATCH, DELETE, etc.)

### Issue: Params type error in TypeScript
**Fix:** Remember to await params in Next.js 15
```typescript
const { id } = await params; // ← Add await
```

---

## 📤 DELIVERABLES

When complete, you will have:

✅ 14 new API endpoints fully functional
✅ All Postman tests passing (100%)
✅ All TypeScript errors resolved (0)
✅ Vercel build succeeding
✅ GitHub commits pushed
✅ Live API ready at: https://money-flow-fresh.vercel.app/api/...

---

## 🎯 SUCCESS CRITERIA

All of the following must be true:

- [ ] All 14 endpoints implemented
- [ ] All 39+ Postman tests passing
- [ ] 0 TypeScript errors
- [ ] Vercel build successful
- [ ] All code committed and pushed
- [ ] No broken functionality
- [ ] Response times < 1.5 seconds
- [ ] Proper error handling on all endpoints

---

## ⏰ TIMELINE

- **Start:** Now
- **Implementation:** 6-8 hours (14 commits)
- **Testing:** Continuous (after each endpoint)
- **Deployment:** Automatic (Vercel)
- **Complete:** When all 14 endpoints pass Postman tests

---

## 📞 IF YOU GET STUCK

**For schema questions:** Read PROJECT-SPEC.md in repo
**For validation errors:** Check src/lib/validation.ts
**For database errors:** Verify table exists on Neon console
**For code issues:** Review previous working endpoints (like GET /api/accounts)
**For deployment issues:** Check Vercel build logs

---

## 🚀 LET'S GO!

You have everything you need:
1. ✅ Complete specification (PHASE2-DETAIL.md)
2. ✅ Database schema (PROJECT-SPEC.md)
3. ✅ Validation rules (src/lib/validation.ts)
4. ✅ Working examples (existing GET endpoints)
5. ✅ Testing tools (Postman collection)
6. ✅ Auto-approval (you're good to commit!)

**Start implementing now. I'm confident you can complete this! 💪**

---

## 📋 FINAL CHECKLIST BEFORE STARTING

- [ ] Read PHASE2-DETAIL.md completely
- [ ] Open PROJECT-SPEC.md to understand schema
- [ ] Review existing GET endpoints as code examples
- [ ] Check src/lib/validation.ts for validation patterns
- [ ] Understand Next.js 15 params handling
- [ ] Have Postman collection ready for testing
- [ ] Ready to commit and push after each endpoint
- [ ] Ready to ask questions if stuck

**When ready, reply: "Phase 2 implementation starting now!" and begin coding.**

---

Happy coding! 🎯🚀
