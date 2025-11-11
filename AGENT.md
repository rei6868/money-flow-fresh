# 🎨 PHASE 3: BUILD UI APPLICATION PROMPT

**Project:** Money Flow Fresh - Financial Management Dashboard
**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Neon PostgreSQL
**API Status:** Phase 2 API (60% working) - API endpoints in development
**Task:** Build complete frontend UI
**Time:** 8-12 hours (2-3 days)
**Auto-Approval:** YES - Build all UI components as specified

---

## 🎯 PROJECT VISION

Build a **professional dark-themed financial dashboard** with:
- 📊 Real-time account & transaction overview
- 💰 Multi-account management
- 📈 Transaction history with filtering
- 👥 People/contact management
- 🏦 Debt tracking
- 💳 Cashback rewards monitoring

**UI Stack:**
- Dark theme (navy/dark blue background)
- Modern glassmorphism cards
- Responsive grid layout
- Smooth transitions & interactions
- shadcn/ui components (Button, Table, Form, Dialog, etc.)

---

## 📋 COMPONENT ARCHITECTURE

```
App Layout (Main)
├── Header/Navigation
├── Sidebar (Navigation menu)
└── Main Content Area
    ├── Dashboard Page (/)
    │   ├── Account Summary Cards
    │   ├── Recent Transactions Table
    │   └── Quick Stats
    │
    ├── Accounts Page (/accounts)
    │   ├── Accounts Table
    │   ├── Create Account Modal
    │   ├── Edit Account Modal
    │   └── Account Details Panel
    │
    ├── Transactions Page (/transactions)
    │   ├── Transactions Table
    │   ├── Filters (account, type, date range)
    │   ├── Create Transaction Modal
    │   ├── Edit Transaction Modal
    │   └── Transaction Details View
    │
    ├── People Page (/people)
    │   ├── People Table
    │   ├── Add Person Modal
    │   └── Edit Person Modal
    │
    ├── Debt Page (/debt)
    │   ├── Debt Table
    │   ├── Add Debt Modal
    │   └── Debt Status Updates
    │
    └── Cashback Page (/cashback)
        ├── Cashback Summary
        ├── Cashback Movements Table
        └── Category Breakdown
```

---

## 🎨 PAGE SPECIFICATIONS

### **1. LAYOUT & NAVIGATION**

**File:** `src/app/layout.tsx`
- Dark theme background (color: #1a1d2e)
- Top header with branding
- Left sidebar with navigation menu
- Responsive: Collapse sidebar on mobile

**Sidebar Menu Items:**
- 🏠 Dashboard
- 💰 Accounts
- 📊 Transactions
- 👥 People
- 🏦 Debt
- 💳 Cashback
- ⚙️ Settings (placeholder)

---

### **2. DASHBOARD PAGE (/)**

**File:** `src/app/page.tsx`

**Components:**
1. **Header Section**
   - Title: "Financial Dashboard"
   - Date & time display
   - Refresh button

2. **Account Summary Cards** (Grid 4 columns)
   ```
   For each account:
   - Account name
   - Current balance (large, formatted)
   - Account type badge
   - Mini sparkline chart (optional)
   - Status indicator
   ```

3. **Quick Stats Section**
   ```
   - Total Assets: Sum of all accounts
   - Total Income (This Month)
   - Total Expenses (This Month)
   - Net Balance (Income - Expense)
   ```

4. **Recent Transactions Table**
   ```
   Columns:
   - Date
   - Description
   - Category
   - Type (Income/Expense/Transfer) - with color badge
   - Amount (right-aligned)
   - Account
   
   Pagination: Show 10 most recent
   Action: Click row to see details
   ```

**API Calls:**
```javascript
// On page load:
GET /api/accounts                    // Get all accounts
GET /api/transactions?limit=10       // Recent transactions
// Calculate totals on frontend
```

---

### **3. ACCOUNTS PAGE (/accounts)**

**File:** `src/app/accounts/page.tsx`

**Components:**

1. **Header with Action**
   - Title: "Accounts"
   - Button: "+ New Account"

2. **Accounts Table**
   ```
   Columns:
   - Account Name
   - Type (Savings/Checking/Investment/Credit)
   - Current Balance (formatted with currency)
   - Currency
   - Status (Active/Inactive/Closed) - badge
   - Created Date
   - Actions (View/Edit/Delete icons)
   
   Features:
   - Sortable columns (click header)
   - Pagination (20 per page)
   - Search/filter by name or type
   ```

3. **Create/Edit Modal**
   ```
   Form Fields:
   - Account Name (text, required)
   - Account Type (dropdown: Savings, Checking, Investment, Credit)
   - Currency (dropdown: VND, USD, EUR)
   - Current Balance (number, default 0)
   
   Buttons: Cancel / Create/Update
   ```

4. **Account Details Panel** (Slide-in from right)
   ```
   Show:
   - Account name, type, currency
   - Current balance
   - Total income & expense
   - Recent transactions for this account
   - Status & timestamps
   
   Actions:
   - Edit button
   - Delete button
   - Close button
   ```

**API Calls:**
```javascript
GET /api/accounts                    // Load all accounts
POST /api/accounts                   // Create new account
PATCH /api/accounts/:id              // Update account
DELETE /api/accounts/:id             // Delete account
GET /api/accounts/:id/balance        // Get balance details (if working)
```

---

### **4. TRANSACTIONS PAGE (/transactions)**

**File:** `src/app/transactions/page.tsx`

**Components:**

1. **Header with Filters**
   - Title: "Transactions"
   - Button: "+ New Transaction"
   - Filter Panel:
     - Account selector (dropdown)
     - Type filter (Income/Expense/Transfer)
     - Date range picker (from/to)
     - Category (dropdown)
     - Search box (description)

2. **Transactions Table**
   ```
   Columns:
   - Date (formatted)
   - Description
   - Category
   - Type (badge: green=income, red=expense, blue=transfer)
   - Amount (right-aligned, formatted)
   - Account
   - Status
   - Actions (View/Edit/Delete)
   
   Features:
   - Sortable columns
   - Pagination (30 per page)
   - Color-coded rows by type
   ```

3. **Create Transaction Modal**
   ```
   Form Fields:
   - Account (required, dropdown)
   - Person/Contact (optional)
   - Type (Income/Expense/Transfer)
   - Amount (required, number)
   - Category (dropdown)
   - Description (text area)
   - Date (date picker)
   - Status (Pending/Completed/Failed)
   
   Logic:
   - On account change: disable/show person based on type
   - On type change: show relevant categories
   
   Buttons: Cancel / Create
   ```

4. **Edit Transaction Modal**
   - Same as Create, pre-filled with data
   - Button: Cancel / Update

5. **Transaction Details View** (Modal or Slide-in)
   ```
   Show:
   - All transaction details
   - Account info
   - Person info (if applicable)
   - Date/time created
   - Status
   - Edit/Delete buttons
   ```

**API Calls:**
```javascript
GET /api/transactions?filters...     // Load transactions
POST /api/transactions               // Create
PATCH /api/transactions/:id          // Update
DELETE /api/transactions/:id         // Delete
GET /api/transactions/:id            // Get details with history
```

---

### **5. PEOPLE PAGE (/people)**

**File:** `src/app/people/page.tsx`

**Components:**

1. **Header**
   - Title: "People/Contacts"
   - Button: "+ Add Person"

2. **People Table**
   ```
   Columns:
   - Name
   - Email
   - Phone
   - Role (Friend/Family/Colleague/Other)
   - Created Date
   - Actions (Edit/Delete)
   
   Pagination: 20 per page
   Search: By name or email
   ```

3. **Add/Edit Person Modal**
   ```
   Form Fields:
   - Name (required)
   - Email (email format)
   - Phone (phone format)
   - Role (dropdown)
   
   Buttons: Cancel / Add/Update
   ```

**API Calls:**
```javascript
GET /api/people                      // List all
POST /api/people                     // Create
PATCH /api/people/:id                // Update (if exists)
DELETE /api/people/:id               // Delete (if exists)
```

---

### **6. DEBT PAGE (/debt)**

**File:** `src/app/debt/page.tsx`

**Components:**

1. **Header & Stats**
   - Title: "Debt Tracker"
   - Button: "+ Add Debt"
   - Stats: Total Debt, Active Debts, Settled

2. **Debt Table**
   ```
   Columns:
   - Debtor Account
   - Creditor Person
   - Amount
   - Reason
   - Due Date
   - Status (Active/Settled/Overdue) - badge
   - Actions
   
   Pagination: 20 per page
   ```

3. **Add Debt Modal**
   ```
   Form Fields:
   - Debtor Account (dropdown)
   - Creditor Person (dropdown)
   - Amount (number)
   - Reason (text)
   - Due Date (date picker)
   
   Buttons: Cancel / Add
   ```

4. **Update Status Modal**
   ```
   Allow marking debt as Settled
   Show confirmation
   ```

**API Calls:**
```javascript
GET /api/debt                        // List debts
POST /api/debt                       // Create
PATCH /api/debt/:id                  // Update status
```

---

### **7. CASHBACK PAGE (/cashback)**

**File:** `src/app/cashback/page.tsx`

**Components:**

1. **Header & Summary**
   - Title: "Cashback Rewards"
   - Summary Cards:
     - Total Earned
     - Pending
     - Credited

2. **Cashback Movements Table**
   ```
   Columns:
   - Date
   - Account
   - Category
   - Amount
   - Rate
   - Status (Pending/Credited)
   - Earned From
   
   Pagination: 20 per page
   Filter: By status, category, date range
   ```

3. **Category Breakdown** (Optional)
   - Pie/Bar chart showing earnings by category
   - Using Chart.js or recharts

**API Calls:**
```javascript
GET /api/cashback?filters...         // List cashback movements
POST /api/cashback                   // Record cashback (if needed)
```

---

## 🛠️ TECHNICAL IMPLEMENTATION DETAILS

### **File Structure**
```
src/
├── app/
│   ├── layout.tsx                    (Main layout with sidebar/header)
│   ├── page.tsx                      (Dashboard)
│   ├── accounts/
│   │   └── page.tsx                  (Accounts page)
│   ├── transactions/
│   │   └── page.tsx                  (Transactions page)
│   ├── people/
│   │   └── page.tsx                  (People page)
│   ├── debt/
│   │   └── page.tsx                  (Debt page)
│   └── cashback/
│       └── page.tsx                  (Cashback page)
│
├── components/
│   ├── Layout/
│   │   ├── Header.tsx                (Top header)
│   │   ├── Sidebar.tsx               (Navigation sidebar)
│   │   └── MainLayout.tsx            (Main wrapper)
│   │
│   ├── Cards/
│   │   ├── AccountCard.tsx           (Account summary card)
│   │   ├── StatsCard.tsx             (Quick stats)
│   │   └── TransactionCard.tsx       (Transaction card)
│   │
│   ├── Tables/
│   │   ├── AccountsTable.tsx         (Accounts table)
│   │   ├── TransactionsTable.tsx     (Transactions table)
│   │   ├── PeopleTable.tsx           (People table)
│   │   ├── DebtTable.tsx             (Debt table)
│   │   └── CashbackTable.tsx         (Cashback table)
│   │
│   ├── Modals/
│   │   ├── AccountModal.tsx          (Create/Edit account)
│   │   ├── TransactionModal.tsx      (Create/Edit transaction)
│   │   ├── PersonModal.tsx           (Create/Edit person)
│   │   ├── DebtModal.tsx             (Create/Edit debt)
│   │   └── CashbackModal.tsx         (Record cashback)
│   │
│   ├── Forms/
│   │   ├── AccountForm.tsx           (Account form)
│   │   ├── TransactionForm.tsx       (Transaction form)
│   │   ├── PersonForm.tsx            (Person form)
│   │   ├── DebtForm.tsx              (Debt form)
│   │   └── FilterPanel.tsx           (Transaction filters)
│   │
│   └── Common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── EmptyState.tsx
│       └── ConfirmDialog.tsx
│
├── lib/
│   ├── api.ts                        (API client/fetcher)
│   ├── hooks/
│   │   ├── useAccounts.ts            (Accounts data hook)
│   │   ├── useTransactions.ts        (Transactions data hook)
│   │   ├── usePeople.ts              (People data hook)
│   │   ├── useDebt.ts                (Debt data hook)
│   │   └── useCashback.ts            (Cashback data hook)
│   ├── types.ts                      (TypeScript interfaces)
│   └── utils.ts                      (Formatting, calculations)
│
└── styles/
    └── globals.css                   (Tailwind + custom styles)
```

---

## 🎨 DESIGN SPECIFICATIONS

### **Color Scheme**
```
Dark Theme:
- Background: #0f1419 (very dark navy)
- Card Background: #1a1d2e (dark navy)
- Accent: #3b82f6 (blue)
- Success: #10b981 (green)
- Warning: #f59e0b (amber)
- Error: #ef4444 (red)
- Text Primary: #f3f4f6 (light gray)
- Text Secondary: #d1d5db (medium gray)
```

### **Typography**
```
- Font: Inter (Google Fonts)
- Headings: Bold
- Body: Regular
- Sizes: 12px (small), 14px (body), 16px (heading), 20px (title), 28px (hero)
```

### **Component Styling**
```
- Buttons: Rounded corners (8px), padding 8-12px
- Inputs: Rounded 6px, border #3b82f6, focus: ring
- Tables: Striped rows, hover effect
- Cards: Rounded 12px, border subtle
- Modals: Centered, dark overlay, rounded 12px
```

---

## 📡 API INTEGRATION PATTERNS

### **1. Data Fetching Hook Pattern**
```typescript
// Example: src/lib/hooks/useAccounts.ts
import { useEffect, useState } from 'react';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        if (!res.ok) throw new Error('Failed to fetch accounts');
        const data = await res.json();
        setAccounts(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  return { accounts, loading, error };
}
```

### **2. Form Submission Pattern**
```typescript
// Example: Create account
const handleCreateAccount = async (formData) => {
  try {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error('Failed to create account');
    const newAccount = await res.json();
    setAccounts([...accounts, newAccount]);
    closeModal();
  } catch (err) {
    setError(err.message);
  }
};
```

### **3. Error Handling**
```typescript
// Handle API errors gracefully
if (error) return <ErrorState message={error} />;
if (loading) return <LoadingSpinner />;
if (!data?.length) return <EmptyState />;
```

---

## 📱 RESPONSIVE DESIGN

- **Desktop:** Full layout with sidebar + main content
- **Tablet:** Sidebar collapses to icons
- **Mobile:** Drawer menu, full-width tables with horizontal scroll

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 3.1: Layout & Navigation
- [ ] Create main layout with Header + Sidebar
- [ ] Setup responsive menu
- [ ] Navigation routing between pages
- [ ] Dark theme styling

### Phase 3.2: Dashboard Page
- [ ] Account summary cards
- [ ] Quick stats section
- [ ] Recent transactions table
- [ ] Connect to API endpoints

### Phase 3.3: Accounts Page
- [ ] Accounts table with sorting/filtering
- [ ] Create/Edit modal
- [ ] Delete with confirmation
- [ ] Account details panel

### Phase 3.4: Transactions Page
- [ ] Transactions table
- [ ] Filter panel (date, category, type, account)
- [ ] Create/Edit transaction modal
- [ ] Search functionality

### Phase 3.5: People Page
- [ ] People table with CRUD
- [ ] Add/Edit person modal
- [ ] Delete confirmation

### Phase 3.6: Debt Page
- [ ] Debt table with status badges
- [ ] Add/Edit debt modal
- [ ] Status update functionality

### Phase 3.7: Cashback Page
- [ ] Cashback movements table
- [ ] Summary cards
- [ ] Optional: Category breakdown chart

### Phase 3.8: Polish & Testing
- [ ] Loading states on all pages
- [ ] Error handling & messages
- [ ] Mobile responsiveness check
- [ ] Form validation
- [ ] API error handling

---

## 🧪 TESTING GUIDELINES

1. **Test each page independently**
2. **Verify API calls succeed or show error gracefully**
3. **Test form validation & submission**
4. **Check responsive layout on mobile/tablet**
5. **Test table sorting/filtering/pagination**
6. **Verify all modals open/close correctly**

---

## 🚀 DEPLOYMENT

```bash
# Build
npm run build

# Test build locally
npm run start

# Deploy to Vercel (auto on git push)
git push origin phase3-ui
```

---

## 📝 NOTES FOR AGENT

1. **API Status:** Some endpoints may return errors or incomplete data - handle gracefully with error states
2. **Mock Data:** If API not fully working, consider adding mock/fallback data for development
3. **Component Priority:** Focus on core pages first (Dashboard, Accounts, Transactions)
4. **shadcn/ui Usage:** Use ready-made components (Table, Form, Dialog, Button, etc.) from shadcn/ui
5. **Tailwind Classes:** Use responsive classes (md:, lg:) for mobile-first design
6. **Type Safety:** Use TypeScript for all components - define types for API responses
7. **Accessibility:** Use semantic HTML, proper aria-labels, keyboard navigation

---

**READY TO BUILD PHASE 3 UI? Let's go! 🚀**
