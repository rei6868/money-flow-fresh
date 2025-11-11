import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const accountResult = await sql`
      SELECT
        account_id,
        current_balance,
        currency,
        status,
        updated_at as last_updated
      FROM accounts
      WHERE account_id = ${id}
    `;

    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const account = accountResult[0];

    const incomeResult = await sql`
      SELECT SUM(amount) as total_income
      FROM transactions
      WHERE account_id = ${id} AND type = 'income' AND deleted_at IS NULL
    `;
    const totalIncome = incomeResult[0]?.total_income || 0;

    const expenseResult = await sql`
      SELECT SUM(amount) as total_expense
      FROM transactions
      WHERE account_id = ${id} AND type = 'expense' AND deleted_at IS NULL
    `;
    const totalExpense = expenseResult[0]?.total_expense || 0;

    return NextResponse.json({
      ...account,
      total_income: totalIncome,
      total_expense: totalExpense,
    });
  } catch (error) {
    console.error('[GET /api/accounts/:id/balance]', error);
    return NextResponse.json(
      { error: 'Failed to fetch account balance' },
      { status: 500 }
    );
  }
}
