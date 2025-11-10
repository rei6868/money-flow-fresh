// types/database.ts

// ENUMs
export type PersonStatus = 'active' | 'inactive' | 'archived';
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'wallet';
export type TransactionType = 'expense' | 'income' | 'debt' | 'repayment' | 'cashback' | 'subscription' | 'import' | 'adjustment';
export type TransactionStatus = 'active' | 'pending' | 'void' | 'canceled';
export type LinkedTxnType = 'refund' | 'split' | 'batch' | 'settle';
export type LinkedTxnStatus = 'active' | 'done' | 'canceled';
export type DebtLedgerStatus = 'open' | 'partial' | 'repaid' | 'overdue';
export type DebtMovementType = 'borrow' | 'repay' | 'adjust' | 'discount' | 'split';
export type DebtMovementStatus = 'active' | 'settled' | 'reversed';
export type CashbackType = 'percent' | 'fixed';
export type CashbackStatus = 'init' | 'applied' | 'exceed_cap' | 'invalidated';
export type AssetType = 'saving' | 'invest' | 'real_estate' | 'crypto' | 'bond' | 'collateral' | 'other';
export type AssetStatus = 'active' | 'sold' | 'transferred' | 'frozen';
export type TransactionHistoryAction = 'update' | 'delete' | 'cashback_update';

// Interfaces
export interface Person {
    /**
     * Unique identifier for the person (UUID)
     */
    person_id: string;
    /**
     * Full name of the person
     */
    full_name: string;
    /**
     * Contact information (e.g., email, phone number)
     */
    contact_info: string | null;
    /**
     * Status of the person
     */
    status: PersonStatus;
    /**
     * Optional group assignment
     */
    group_id: string | null;
    /**
     * URL of the person's image
     */
    img_url: string | null;
    /**
     * Additional notes about the person
     */
    note: string | null;
    /**
     * Timestamp of when the person was created
     */
    created_at: Date;
    /**
     * Timestamp of when the person was last updated
     */
    updated_at: Date;
}

export interface Account {
    /**
     * Unique identifier for the account (UUID)
     */
    account_id: string;
    /**
     * Foreign key linking to the Person table
     */
    person_id: string;
    /**
     * Name of the account
     */
    account_name: string;
    /**
     * Type of the account
     */
    account_type: AccountType;
    /**
     * Currency of the account (default: VND)
     */
    currency: string;
    /**
     * Status of the account
     */
    status: 'active' | 'inactive' | 'closed' | 'suspended';
    /**
     * Timestamp of when the account was created
     */
    created_at: Date;
    /**
     * Timestamp of when the account was last updated
     */
    updated_at: Date;
}

export interface Transaction {
    /**
     * Unique identifier for the transaction (UUID)
     */
    transaction_id: string;
    /**
     * Foreign key linking to the Account table (required)
     */
    account_id: string;
    /**
     * Foreign key linking to the Person table (optional)
     */
    person_id: string | null;
    /**
     * Type of the transaction
     */
    type: TransactionType;
    /**
     * Foreign key linking to the Category table
     */
    category_id: string | null;
    /**
     * Amount of the transaction
     */
    amount: number;
    /**
     * Fee associated with the transaction
     */
    fee: number | null;
    /**
     * Status of the transaction
     */
    status: TransactionStatus;
    /**
     * Date when the transaction occurred
     */
    occurred_on: Date;
    /**
     * Additional notes about the transaction
     */
    notes: string | null;
    /**
     * Foreign key for related transactions
     */
    linked_txn_id: string | null;
    /**
     * Timestamp of when the transaction was created
     */
    created_at: Date;
    /**
     * Timestamp of when the transaction was last updated
     */
    updated_at: Date;
}

export interface LinkedTransaction {
    /**
     * Unique identifier for the linked transaction (UUID)
     */
    linked_txn_id: string;
    /**
     * Foreign key to the original transaction
     */
    parent_txn_id: string;
    /**
     * Type of the linked transaction
     */
    type: LinkedTxnType;
    /**
     * Array of related transaction IDs
     */
    related_txn_ids: string[];
    /**
     * Status of the linked transaction
     */
    status: LinkedTxnStatus;
    /**
     * Additional notes about the linked transaction
     */
    notes: string | null;
    /**
     * Timestamp of when the linked transaction was created
     */
    created_at: Date;
    /**
     * Timestamp of when the linked transaction was last updated
     */
    updated_at: Date;
}

export interface DebtLedger {
    /**
     * Unique identifier for the debt ledger (UUID)
     */
    debt_ledger_id: string;
    /**
     * Foreign key linking to the Person table
     */
    person_id: string;
    /**
     * Monthly/weekly cycle identifier (e.g., "2024-11")
     */
    cycle_tag: string;
    /**
     * Initial debt amount
     */
    initial_debt: number;
    /**
     * New debt amount
     */
    new_debt: number;
    /**
     * Repayments amount
     */
    repayments: number;
    /**
     * Debt discount amount
     */
    debt_discount: number;
    /**
     * Calculated net debt
     */
    net_debt: number;
    /**
     * Status of the debt ledger
     */
    status: DebtLedgerStatus;
    /**
     * Timestamp of when the debt ledger was last updated
     */
    last_updated: Date;
    /**
     * Additional notes about the debt ledger
     */
    notes: string | null;
}

export interface DebtMovement {
    /**
     * Unique identifier for the debt movement (UUID)
     */
    debt_movement_id: string;
    /**
     * Foreign key linking to the Transaction table
     */
    transaction_id: string;
    /**
     * Foreign key linking to the Person table
     */
    person_id: string;
    /**
     * Foreign key linking to the Account table
     */
    account_id: string;
    /**
     * Type of the debt movement
     */
    movement_type: DebtMovementType;
    /**
     * Amount of the debt movement
     */
    amount: number;
    /**
     * Monthly/weekly cycle identifier (e.g., "2024-11")
     */
    cycle_tag: string;
    /**
     * Status of the debt movement
     */
    status: DebtMovementStatus;
    /**
     * Additional notes about the debt movement
     */
    notes: string | null;
    /**
     * Timestamp of when the debt movement was created
     */
    created_at: Date;
    /**
     * Timestamp of when the debt movement was last updated
     */
    updated_at: Date;
}

export interface CashbackMovement {
    /**
     * Unique identifier for the cashback movement (UUID)
     */
    cashback_movement_id: string;
    /**
     * Foreign key linking to the Transaction table
     */
    transaction_id: string;
    /**
     * Foreign key linking to the Account table
     */
    account_id: string;
    /**
     * Monthly cycle identifier
     */
    cycle_tag: string;
    /**
     * Type of the cashback
     */
    cashback_type: CashbackType;
    /**
     * Percentage or fixed value of the cashback
     */
    cashback_value: number;
    /**
     * Calculated cashback amount
     */
    cashback_amount: number;
    /**
     * Status of the cashback movement
     */
    status: CashbackStatus;
    /**
     * Monthly cap limit
     */
    budget_cap: number;
    /**
     * Additional notes about the cashback movement
     */
    note: string | null;
    /**
     * Timestamp of when the cashback movement was created
     */
    created_at: Date;
    /**
     * Timestamp of when the cashback movement was last updated
     */
    updated_at: Date;
}

export interface TransactionHistory {
    /**
     * Unique identifier for the history entry (UUID)
     */
    history_id: string;
    /**
     * Foreign key linking to the Transaction table
     */
    transaction_id: string;
    /**
     * Unique snapshot ID of the transaction
     */
    transaction_id_snapshot: string;
    /**
     * Old amount before the change
     */
    old_amount: number | null;
    /**
     * New amount after the change
     */
    new_amount: number | null;
    /**
     * Old cashback amount before the change
     */
    old_cashback: number | null;
    /**
     * New cashback amount after the change
     */
    new_cashback: number | null;
    /**
     * Old debt amount before the change
     */
    old_debt: number | null;
    /**
     * New debt amount after the change
     */
    new_debt: number | null;
    /**
     * Type of action that was performed
     */
    action_type: TransactionHistoryAction;
    /**
     * Sequence number for the history entry
     */
    seq_no: number;
    /**
     * User who edited the transaction
     */
    edited_by: string | null;
    /**
     * Timestamp of when the history entry was created
     */
    created_at: Date;
}

export interface Asset {
    /**
     * Unique identifier for the asset (UUID)
     */
    asset_id: string;
    /**
     * Name of the asset
     */
    asset_name: string;
    /**
     * Type of the asset
     */
    asset_type: AssetType;
    /**
     * Foreign key linking to the owner
     */
    owner_id: string;
    /**
     * Foreign key linking to the linked account
     */
    linked_account_id: string | null;
    /**
     * Status of the asset
     */
    status: AssetStatus;
    /**
     * Current value of the asset
     */
    current_value: number;
    /**
     * Initial value of the asset
     */
    initial_value: number;
    /**
     * Currency of the asset
     */
    currency: string;
    /**
     * Date when the asset was acquired
     */
    acquired_at: Date | null;
    /**
     * URL of the asset's image
     */
    img_url: string | null;
    /**
     * Additional notes about the asset
     */
    notes: string | null;
    /**
     * Timestamp of when the asset was created
     */
    created_at: Date;
    /**
     * Timestamp of when the asset was last updated
     */
    updated_at: Date;
}
