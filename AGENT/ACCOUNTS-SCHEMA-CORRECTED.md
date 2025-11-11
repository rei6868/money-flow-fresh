# 📊 ACCOUNTS TABLE SCHEMA - CORRECTED & VERIFIED

**Source:** Direct export from Neon database (2025-11-11)  
**Status:** ✅ DEFINITIVE - This is the REAL schema in production

---

## 🎯 REAL CREATE TABLE STATEMENT

```sql
CREATE TABLE "public"."accounts" (
    "account_id" character varying(36) PRIMARY KEY NOT NULL,
    "account_name" character varying(120) NOT NULL,
    "img_url" text,
    "account_type" account_type NOT NULL,
    "owner_id" character varying(36),
    "parent_account_id" character varying(36),
    "asset_ref" character varying(36),
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

---

## 📋 FIELD REFERENCE

### Columns by Category:

#### **Primary & Identity**
| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `account_id` | varchar(36) | ❌ NO | - | PRIMARY KEY, UUID format |

#### **Basic Info**
| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `account_name` | varchar(120) | ❌ NO | - | Max 120 chars, NOT 80! |
| `account_type` | ENUM | ❌ NO | - | checking, savings, credit, investment, wallet |
| `status` | ENUM | ❌ NO | - | active, inactive, closed, suspended |
| `img_url` | text | ✅ YES | NULL | Optional image URL |
| `notes` | text | ✅ YES | NULL | Optional notes |

#### **Relationships & References**
| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `owner_id` | varchar(36) | ✅ YES | NULL | FK to people.person_id (OPTIONAL) |
| `parent_account_id` | varchar(36) | ✅ YES | NULL | For hierarchical accounts |
| `asset_ref` | varchar(36) | ✅ YES | NULL | Reference to assets table |

#### **Balance Tracking** ⭐ CRITICAL
| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `opening_balance` | numeric(18,2) | ❌ NO | - | Initial balance - MUST provide on creation |
| `current_balance` | numeric(18,2) | ❌ NO | - | Current balance (usually = opening_balance initially) |
| `total_in` | numeric(18,2) | ❌ NO | 0 | Sum of all income transactions |
| `total_out` | numeric(18,2) | ❌ NO | 0 | Sum of all expense transactions |

#### **Timestamps**
| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `created_at` | timestamp with timezone | ❌ NO | now() | Auto-set by DB |
| `updated_at` | timestamp with timezone | ❌ NO | now() | Auto-set by DB |

---

## ✅ WHAT YOU MUST PROVIDE (CREATE)

When creating an account, provide:
```json
{
  "account_name": "string (max 120 chars)",
  "account_type": "checking|savings|credit|investment|wallet",
  "opening_balance": number (required - can be 0),
  "current_balance": number (required - can be 0),
  "status": "active|inactive|closed|suspended"
}
```

Optional fields:
```json
{
  "owner_id": "uuid (optional)",
  "parent_account_id": "uuid (optional)",
  "asset_ref": "uuid (optional)",
  "total_in": number (default 0),
  "total_out": number (default 0),
  "img_url": "url (optional)",
  "notes": "string (optional)"
}
```

**DO NOT send:** `currency`, `person_id` - these don't exist in accounts table!

---

## 🔴 COMMON MISTAKES (Avoid!)

| ❌ WRONG | ✅ CORRECT |
|---------|-----------|
| `currency` field | ❌ Delete it - doesn't exist |
| `person_id` field | Use `owner_id` instead |
| `account_name` length 80 | Max is **120** characters |
| Don't set `opening_balance` | ❌ MUST provide - NOT NULL |
| Don't set `current_balance` | ❌ MUST provide - NOT NULL |
| Forget `status` | ❌ MUST provide - NOT NULL |
| Send only 3 fields | ❌ All NOT NULL fields required |

---

## 💡 INITIALIZATION LOGIC

When creating a new account:

```
opening_balance = user-provided value (or 0)
current_balance = opening_balance (initially)
total_in = 0 (default)
total_out = 0 (default)
owner_id = null (unless provided)
parent_account_id = null (unless provided)
asset_ref = null (unless provided)
```

---

## 🔗 ENUM TYPES (Referenced in this table)

### account_type ENUM
```
'checking'
'savings'
'credit'
'investment'
'wallet'
```

### account_status ENUM
```
'active'
'inactive'
'closed'
'suspended'
```

---

## 📍 INDEXES

```
Primary Key: accounts_pkey (account_id)
```

---

## 🎯 INSERT EXAMPLE

```sql
INSERT INTO accounts (
    account_id, 
    account_name, 
    account_type, 
    opening_balance, 
    current_balance, 
    status, 
    created_at, 
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'My Checking Account',
    'checking'::account_type,
    1000.00,
    1000.00,
    'active'::account_status,
    now(),
    now()
);
```

---

## ✅ THIS SCHEMA IS 100% VERIFIED

- ✅ Exported directly from Neon production database
- ✅ All column names, types, nullable status confirmed
- ✅ No more guessing - this is the REAL schema
- ✅ Use this for all API development

**No more schema confusion! This is the source of truth.**
