import { queryOne } from '@/lib/db';
import { NextRequest } from 'next/server';
import { Account } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. GET account
    const account = await queryOne<Account>(
      'SELECT * FROM accounts WHERE account_id = $1',
      [id]
    );

    if (!account) {
      return Response.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // 2. RETURN balance info
    return Response.json({
      account_id: id,
      account_name: account.account_name,
      account_type: account.account_type,
      opening_balance: account.opening_balance,
      current_balance: account.current_balance,
      total_in: account.total_in,
      total_out: account.total_out,
      status: account.status,
      as_of_date: new Date().toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('[GET /api/accounts/[id]/balance]', error);
    return Response.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
