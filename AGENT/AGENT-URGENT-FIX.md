# 🚀 URGENT FIX - VERCEL BUILD FAILED

**Agent:** Jules
**Priority:** 🔴 CRITICAL - Build is broken
**Time Needed:** 15-20 minutes
**Action:** Fix SQL syntax errors immediately

---

## 📢 BUILD ERROR REPORT

Your latest commit has a **SQL syntax error** causing Vercel build to fail:

```
./src/app/api/accounts/[id]/route.ts:88:7
Type error: Argument of type 'string' is not assignable to parameter of type 'TemplateStringsArray'.
```

**Root Cause:** You used the **WRONG SQL syntax** in the DELETE handler

---

## ❌ THE PROBLEM

### Wrong Pattern (What you did):
```typescript
const result = await sql(
  "UPDATE accounts SET deleted_at = NOW(), status = 'closed' WHERE account_id = $1",
  [id]
);
```

### Error:
- `sql()` doesn't accept string + params array
- Neon SDK requires **template literals** (backticks)
- TypeScript can't parse string-based SQL

---

## ✅ THE SOLUTION

### Correct Pattern (What to do):
```typescript
const result = await sql`
  UPDATE accounts 
  SET deleted_at = NOW(), status = 'closed' 
  WHERE account_id = ${id}
`;
```

### Key Changes:
- Use backticks `` ` `` instead of quotes `"` or `'`
- Variables go inside `${}` not as separate array
- This is **parameterized query** = safe + type-safe

---

## 🔧 STEP-BY-STEP FIX

### Step 1: Find the error
```bash
# Open file
src/app/api/accounts/[id]/route.ts

# Find line 88 with the error
# Look for: sql("UPDATE accounts SET...")
```

### Step 2: Replace ALL wrong patterns

**Search for ALL these patterns in this file:**
```
sql("
sql('
```

**Replace with template literals:**
```
sql`
```

### Step 3: Review the file

Open `src/app/api/accounts/[id]/route.ts` and fix:

#### DELETE Handler (Line ~88):
```typescript
// ❌ BEFORE
const result = await sql(
  "UPDATE accounts SET deleted_at = NOW(), status = 'closed' WHERE account_id = $1",
  [id]
);

// ✅ AFTER
const result = await sql`
  UPDATE accounts 
  SET deleted_at = NOW(), status = 'closed' 
  WHERE account_id = ${id}
`;
```

### Step 4: Check for same issues in other files

Search entire `src/app/api/` for the **WRONG pattern**:
```
sql("
sql('
```

If found anywhere else, **fix all of them** too:
- Accounts routes
- Transactions routes (if implemented)
- Debt routes (if implemented)
- Cashback routes (if implemented)
- People routes (if implemented)

### Step 5: Verify the fix

```bash
# Test compile
npm run build

# Should output: ✅ Successfully compiled
# Not: ❌ Type error
```

### Step 6: Commit and push

```bash
git add -A
git commit -m "fix: correct sql template literal syntax - fix vercel build"
git push origin main
```

Vercel will auto-deploy and build should ✅ PASS

---

## 📚 SQL TEMPLATE LITERAL EXAMPLES

### SELECT
```typescript
const accounts = await sql`
  SELECT * FROM accounts WHERE account_id = ${id}
`;
```

### INSERT
```typescript
const result = await sql`
  INSERT INTO accounts (account_name, account_type, current_balance)
  VALUES (${name}, ${type}, ${balance})
  RETURNING *
`;
```

### UPDATE
```typescript
const result = await sql`
  UPDATE accounts 
  SET account_name = ${newName}, status = ${newStatus}
  WHERE account_id = ${id}
  RETURNING *
`;
```

### DELETE (Soft Delete)
```typescript
const result = await sql`
  UPDATE accounts 
  SET deleted_at = NOW(), status = 'closed'
  WHERE account_id = ${id}
`;
```

### WITH FILTERING
```typescript
const results = await sql`
  SELECT * FROM transactions 
  WHERE account_id = ${accountId} 
  AND type = ${type}
  ORDER BY created_at DESC
  LIMIT ${limit}
  OFFSET ${offset}
`;
```

---

## ⏱️ QUICK CHECKLIST

- [ ] Open `src/app/api/accounts/[id]/route.ts`
- [ ] Find line 88 DELETE handler
- [ ] Change `sql("...")` to `` sql`...` ``
- [ ] Search all other route files for same pattern
- [ ] Fix all occurrences
- [ ] Test: `npm run build` → passes ✅
- [ ] Commit: `git add -A && git commit -m "..."`
- [ ] Push: `git push origin main`
- [ ] Wait for Vercel build → should pass ✅

---

## 🎯 AFTER FIX

Once deployed:
- ✅ Vercel build will succeed
- ✅ All endpoints will work
- ✅ Can continue Phase 2 implementation
- ✅ Next commit should be new endpoint

---

## 🆘 IF STILL BROKEN

If you get similar errors after fix:
1. Ensure you're using backticks `` ` `` not quotes
2. Use `${}` for variables, not `$1, $2`
3. Don't pass array as second parameter
4. Check all files in `src/app/api/` directory
5. Run `npm run type-check` to find all TS errors

---

**START FIXING NOW - This should take 15-20 minutes!** 💪

Reply: "SQL syntax fix completed!" when done.
