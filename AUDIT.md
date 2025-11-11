# Phase 2 API Audit Report

This document outlines the audit of the current API implementation against the `TESTING-GUIDE.md` specifications.

## Summary

| Endpoint Group | Status | Notes |
|---|---|---|
| Transactions | 🔧 Needs Rebuild | Significant discrepancies in response format, validation, and error handling. |
| Accounts | 🔧 Needs Rebuild | Missing endpoints, incorrect response structures. |
| People | 🔧 Needs Rebuild | Incorrect database queries and response formats. |
| Debt | 🔧 Needs Rebuild | Incorrect database queries and response formats. |
| Cashback | 🔧 Needs Rebuild | Incorrect database queries and response formats. |

---

## Detailed Endpoint Analysis

### Transactions

**GET /api/transactions**
- ✅ Route file exists
- ❌ Pagination not implemented correctly
- ❌ Response structure does not match guide
- ❌ Filtering not fully implemented

**POST /api/transactions**
- ✅ Route file exists
- ❌ Request body validation is incomplete
- ❌ Account balance is not recalculated

**GET /api/transactions/:id**
- ✅ Route file exists
- ❌ Response does not include `transaction_history`

**PATCH /api/transactions/:id**
- ✅ Route file exists
- ❌ Partial updates are not handled correctly

**DELETE /api/transactions/:id**
- ✅ Route file exists
- ❌ Soft delete is not implemented correctly

### Accounts

**GET /api/accounts**
- ✅ Route file exists
- ❌ Pagination not implemented

**POST /api/accounts**
- ✅ Route file exists
- ❌ Incorrect field names in Zod schema

**GET /api/accounts/:id/balance**
- ❌ Route file does not exist

**PATCH /api/accounts/:id**
- ✅ Route file exists
- ❌ Update logic is incorrect

### People

**GET /api/people**
- ✅ Route file exists
- ❌ Incorrect database query

**POST /api/people**
- ✅ Route file exists
- ❌ Incorrect database query

### Debt

**GET /api/debt**
- ✅ Route file exists
- ❌ Incorrect database query

**POST /api/debt**
- ✅ Route file exists
- ❌ Incorrect database query

**PATCH /api/debt/:id**
- ✅ Route file exists
- ❌ Incorrect database query

### Cashback

**GET /api/cashback**
- ✅ Route file exists
- ❌ Summary not included in response

**POST /api/cashback**
- ✅ Route file exists
- ❌ Incorrect database query

---

## Database Schema Verification

The database schema significantly deviates from the specifications in `TESTING-GUIDE.md`. The following tables have incorrect column names, extra columns, and incorrect data types. This will require significant mapping and logic changes in the API code to match the guide's expected request/response formats.

### `accounts` table
- `account_id` is `character varying` instead of `uuid`.
- Missing `currency` column.
- Has extra columns: `opening_balance`, `total_in`, `total_out`, `notes`, `img_url`, `owner_id`, `parent_account_id`, `asset_ref`.

### `transactions` table
- `transaction_id` instead of `id`.
- `occurred_on` (date) instead of `transaction_date` (timestamp).
- `notes` instead of `description`.
- `category_id` instead of `category` (string).
- Has extra columns: `fee`, `shop_id`, `subscription_member_id`, `linked_txn_id`.

### `transaction_history` table
- `history_id` instead of `id`.
- `action_type` instead of `action`.
- `created_at` instead of `changed_at`.
- Does not have `previous_values` and `new_values` columns. Instead has many `old_*` and `new_*` columns.

### `people` table
- `person_id` instead of `id`.
- `full_name` instead of `personName`.
- `contact_info` (text) instead of separate `email` and `phone` columns.
- Has extra columns: `status`, `img_url`, `note`, `group_id`.

### `debt_ledger` table
- Schema is completely different. It seems to be an aggregate table per person, not for individual debt items.
- `debt_ledger_id` instead of `id`.
- Lacks `debtorAccountId`, `creditorPersonId`, `amount`, `reason`, `dueDate`.

### `cashback_movements` table
- Schema is completely different.
- `cashback_movement_id` instead of `id`.
- Lacks `category`, `rate`, `earnedFrom`.
- The `summary` fields expected in the API response (`total_earned`, `total_pending`, `total_credited`) cannot be calculated from the existing columns.
