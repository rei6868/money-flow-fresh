import { queryOne } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const account = await queryOne<{
      account_id: string;
      current_balance: number;
      currency: string;
      status: string;
      updated_at: string;
    }>(
      'SELECT account_id, current_balance, currency, status, updated_at FROM accounts WHERE account_id = $1',
      [id]
    );

    if (!account) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    const incomeResult = await queryOne<{ total_income: string }>(
      "SELECT COALESCE(SUM(amount), 0) as total_income FROM transactions WHERE account_id = $1 AND type = 'income' AND deleted_at IS NULL",
      [id]
    );

    const expenseResult = await queryOne<{ total_expense: string }>(
      "SELECT COALESCE(SUM(amount), 0) as total_expense FROM transactions WHERE account_id = $1 AND type = 'expense' AND deleted_at IS NULL",
      [id]
    );

    const totalIncome = parseFloat(incomeResult?.total_income || '0');
    const totalExpense = parseFloat(expenseResult?.total_expense || '0');

    return Response.json({
      accountId: account.account_id,
      currentBalance: account.current_balance,
      currency: account.currency,
      totalIncome,
      totalExpense,
      status: account.status,
      lastUpdated: account.updated_at,
    });

  } catch (error) {
    console.error(`[GET /api/accounts/${(await (params as any))?.id}/balance]`, error);
    return Response.json(
      { error: 'Failed to fetch account balance' },
      { status: 500 }
    );
  }
}
