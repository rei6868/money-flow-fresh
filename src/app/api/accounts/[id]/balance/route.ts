import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const account = await sql`
      SELECT
        a.account_id,
        a.current_balance,
        'VND' AS currency,
        a.status,
        a.updated_at AS last_updated,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense
      FROM
        accounts a
      LEFT JOIN
        transactions t ON a.account_id = t.account_id
      WHERE
        a.account_id = ${id}
      GROUP BY
        a.account_id
    `;

    if (account.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account[0]);
  } catch (error) {
    console.error('[GET /api/accounts/:id/balance]', error);
    return NextResponse.json({ error: 'Failed to fetch account balance' }, { status: 500 });
  }
}
