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
        account_id,
        current_balance,
        currency,
        total_in as total_income,
        total_out as total_expense,
        status,
        updated_at as last_updated
      FROM accounts
      WHERE account_id = ${id}
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
