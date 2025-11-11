# 🔴 VERCEL DEPLOY ERROR - FIX IMMEDIATELY

## 🎯 ERROR ANALYSIS

**File:** `src/app/api/accounts/[id]/route.ts`
**Line:** 88
**Issue:** Using `sql()` as function call, but should use SQL template literal syntax

**Error Message:**
```
Type error: Argument of type 'string' is not assignable to parameter of type 'TemplateStringsArray'.
```

---

## ❌ WHAT'S WRONG

Agent is using **WRONG SQL syntax:**

```typescript
// ❌ WRONG - This won't work
const result = await sql(
  "UPDATE accounts SET deleted_at = NOW(), status = 'closed' WHERE account_id = $1",
  [id]
);
```

**Problem:** 
- `sql()` expects a **template literal** (backticks), not a regular string
- Passing string as first argument = `TemplateStringsArray` type error
- Neon SDK requires template literal syntax for type safety

---

## ✅ CORRECT SYNTAX

Use **template literal with backticks:**

```typescript
// ✅ CORRECT - SQL template literal
const result = await sql`
  UPDATE accounts 
  SET deleted_at = NOW(), status = 'closed' 
  WHERE account_id = ${id}
`;
```

**Key differences:**
- Backticks `` ` `` instead of quotes `"` or `'`
- `${}` for variables (not `$1`, `$2`, etc.)
- No separate params array

---

## 🔧 HOW TO FIX

### **Step 1: Review all SQL queries in DELETE handler**

Find this code in `src/app/api/accounts/[id]/route.ts` around line 88:

```typescript
// ❌ CURRENT (WRONG)
const result = await sql(
  "UPDATE accounts SET deleted_at = NOW(), status = 'closed' WHERE account_id = $1",
  [id]
);
```

### **Step 2: Replace with correct syntax**

```typescript
// ✅ FIXED
const result = await sql`
  UPDATE accounts 
  SET deleted_at = NOW(), status = 'closed' 
  WHERE account_id = ${id}
`;
```

### **Step 3: Check for same pattern in other routes**

Search for this **WRONG pattern** in all route files:
```
sql("SELECT ... WHERE id = $1", [id])
sql("UPDATE ... WHERE id = $1", [data])
sql("DELETE ... WHERE id = $1", [id])
sql("INSERT ... VALUES ($1, $2)", [val1, val2])
```

Replace ALL with **template literal syntax** `` sql`...` ``

---

## 📋 CORRECT PATTERNS FOR ALL OPERATIONS

### ✅ SELECT
```typescript
// CORRECT
const result = await sql`
  SELECT * FROM accounts WHERE account_id = ${id}
`;
```

### ✅ INSERT
```typescript
// CORRECT
const result = await sql`
  INSERT INTO accounts (account_name, account_type, current_balance)
  VALUES (${accountName}, ${accountType}, ${currentBalance})
  RETURNING *
`;
```

### ✅ UPDATE
```typescript
// CORRECT
const result = await sql`
  UPDATE accounts 
  SET account_name = ${newName}, status = ${newStatus}
  WHERE account_id = ${id}
  RETURNING *
`;
```

### ✅ DELETE (Soft Delete)
```typescript
// CORRECT
const result = await sql`
  UPDATE accounts 
  SET deleted_at = NOW(), status = 'closed'
  WHERE account_id = ${id}
`;
```

### ✅ WITH FILTERING
```typescript
// CORRECT
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

## 🚨 CRITICAL: Check All Files

Agent likely made this same mistake in other route files. **Search and fix all of them:**

Files to check:
- [ ] `src/app/api/accounts/[id]/route.ts` ← PRIMARY ERROR
- [ ] `src/app/api/transactions/route.ts` (if implemented)
- [ ] `src/app/api/transactions/[id]/route.ts` (if implemented)
- [ ] `src/app/api/debt/route.ts` (if implemented)
- [ ] `src/app/api/debt/[id]/route.ts` (if implemented)
- [ ] `src/app/api/cashback/route.ts` (if implemented)
- [ ] `src/app/api/people/route.ts` (if implemented)

---

## 🔍 QUICK FIX SCRIPT

Search in entire `src/app/api/` directory for this pattern:

```
sql("
sql('
```

Replace ALL occurrences with template literal syntax `` sql` ``

Example:
- `sql("SELECT ...)` → `` sql`SELECT ...)` ``
- `sql('UPDATE ...)` → `` sql`UPDATE ...)` ``

---

## ✅ AFTER FIX

Once fixed:

1. **Verify syntax:**
   ```bash
   npm run type-check
   ```
   Should show: ✅ 0 errors

2. **Test build:**
   ```bash
   npm run build
   ```
   Should show: ✅ Successfully compiled

3. **Commit:**
   ```bash
   git add -A
   git commit -m "fix: correct sql template literal syntax in all routes"
   git push origin main
   ```

4. **Vercel will auto-deploy:** ✅ Build should pass

---

## 📚 WHY THIS MATTERS

Neon PostgreSQL SDK (used in project) has **strict type checking:**

- ✅ **Template literals** = Parameterized queries (safe, type-safe)
- ❌ **String concatenation** = SQL injection vulnerability (UNSAFE)
- ❌ **Function call with string** = Type error (compile fail)

The SDK enforces using backticks for security and type safety.

---

## 🎯 QUICK ACTION PLAN

**For Agent:**
1. Open `src/app/api/accounts/[id]/route.ts`
2. Find line 88 with the error
3. Change `sql("...")` to `` sql`...` ``
4. Search all other files for same pattern
5. Fix all occurrences
6. Test: `npm run build` → should pass
7. Commit and push

**For You:**
1. Tell Agent to apply this fix
2. Monitor build on Vercel
3. Build should succeed ✅
4. Continue Phase 2 implementation

---

**Need me to create a detailed fix prompt for the Agent?** 🚀
