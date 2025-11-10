// src/utils/calculations.ts

import { queryMany, execute, queryOne } from '@/lib/db';
import { Transaction } from '@/types/database';

/**
 * Calculates the balance of a given account.
 *
 * @param accountId - The ID of the account to calculate the balance for.
 * @param asOfDate - The date to calculate the balance as of (defaults to today).
 * @returns An object containing the balance breakdown.
 */
export async function calculateAccountBalance(
    accountId: string,
    asOfDate?: Date
): Promise<{
    opening_balance: number;
    total_income: number;
    total_expense: number;
    total_debt: number;
    total_repayments: number;
    total_cashback: number;
    total_fees: number;
    current_balance: number;
}> {
    try {
        const date = asOfDate || new Date();
        const transactions = await queryMany<Transaction>(
            `SELECT * FROM "transactions" WHERE account_id = $1 AND occurred_on <= $2 AND status = 'active'`,
            [accountId, date.toISOString().split('T')[0]]
        );

        let total_income = 0;
        let total_expense = 0;
        let total_debt = 0;
        let total_repayments = 0;
        let total_cashback = 0;
        let total_fees = 0;

        for (const t of transactions) {
            switch (t.type) {
                case 'income':
                    total_income += t.amount;
                    break;
                case 'expense':
                    total_expense += t.amount;
                    break;
                case 'debt':
                    total_debt += t.amount;
                    break;
                case 'repayment':
                    total_repayments += t.amount;
                    break;
                case 'cashback':
                    total_cashback += t.amount;
                    break;
                case 'adjustment':
                    if (t.amount > 0) {
                        total_income += t.amount;
                    } else {
                        total_expense += Math.abs(t.amount);
                    }
                    break;
            }
            if (t.fee) {
                total_fees += t.fee;
            }
        }

        const opening_balance = 0; // Assuming 0 for now
        const current_balance = opening_balance + total_income + total_cashback - total_expense - total_fees + total_repayments - total_debt;


        return {
            opening_balance,
            total_income,
            total_expense,
            total_debt,
            total_repayments,
            total_cashback,
            total_fees,
            current_balance,
        };
    } catch (error) {
        console.error('Error calculating account balance:', error);
        throw error;
    }
}

/**
 * Calculates the debt ledger for a given person and cycle.
 *
 * @param personId - The ID of the person.
 * @param cycleTag - The cycle tag (e.g., "2024-11").
 * @returns An object containing the debt ledger breakdown.
 */
export async function calculateDebtLedger(
    personId: string,
    cycleTag: string
): Promise<{
    initial_debt: number;
    new_debt: number;
    repayments: number;
    debt_discount: number;
    net_debt: number;
    status: 'open' | 'partial' | 'repaid' | 'overdue';
}> {
    // This is a placeholder implementation
    return {
        initial_debt: 0,
        new_debt: 0,
        repayments: 0,
        debt_discount: 0,
        net_debt: 0,
        status: 'open',
    };
}

/**
 * Calculates the cashback for a given transaction.
 *
 * @param transactionId - The ID of the transaction.
 * @param accountId - The ID of the account.
 * @param amount - The amount of the transaction.
 * @param cycleTag - The cycle tag.
 * @returns An object containing the cashback calculation.
 */
export async function calculateCashback(
    transactionId: string,
    accountId: string,
    amount: number,
    cycleTag: string
): Promise<{
    cashback_type: 'percent' | 'fixed';
    cashback_value: number;
    cashback_amount: number;
    exceeded_cap: boolean;
    capped_amount?: number;
}> {
    // This is a placeholder implementation
    return {
        cashback_type: 'percent',
        cashback_value: 0,
        cashback_amount: 0,
        exceeded_cap: false,
    };
}

/**
 * Records the history of a transaction.
 *
 * @param transactionId - The ID of the transaction.
 * @param oldState - The old state of the transaction.
 * @param newState - The new state of the transaction.
 * @param actionType - The type of action performed.
 * @param editedBy - The user who edited the transaction.
 */
export async function recordTransactionHistory(
    transactionId: string,
    oldState: Partial<Transaction>,
    newState: Partial<Transaction>,
    actionType: 'update' | 'delete' | 'cashback_update',
    editedBy?: string
): Promise<void> {
    try {
        const seqNoResult = await queryOne<{ max_seq_no: number }>(
            `SELECT MAX(seq_no) as max_seq_no FROM "transaction_history" WHERE transaction_id = $1`,
            [transactionId]
        );
        const seq_no = (seqNoResult?.max_seq_no || 0) + 1;

        await execute(
            `INSERT INTO "transaction_history" (transaction_id, transaction_id_snapshot, old_amount, new_amount, action_type, seq_no, edited_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                transactionId,
                crypto.randomUUID(),
                oldState.amount ?? null,
                newState.amount ?? null,
                actionType,
                seq_no,
                editedBy ?? null,
            ]
        );
    } catch (error) {
        console.error('Error recording transaction history:', error);
        throw error;
    }
}
