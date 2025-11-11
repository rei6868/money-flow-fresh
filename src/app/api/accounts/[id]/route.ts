import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { UpdateAccountSchema } from '@/lib/accounts';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = UpdateAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { accountName, accountType, currency, currentBalance } = validation.data;

    const originalAccountResult = await sql`SELECT * FROM accounts WHERE account_id = ${id}`;
    if (originalAccountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const updateFields: any[] = [];
    if (accountName) updateFields.push(sql`account_name = ${accountName}`);
    if (accountType) updateFields.push(sql`account_type = ${accountType}`);
    if (currency) updateFields.push(sql`currency = ${currency}`);
    if (currentBalance) updateFields.push(sql`current_balance = ${currentBalance}`);

    const updatedAccountResult = await sql`
      UPDATE accounts
      SET ${(sql as any).join(updateFields, sql`, `)}
      WHERE account_id = ${id}
      RETURNING
        account_id as id,
        account_name,
        account_type,
        current_balance,
        currency,
        status,
        created_at,
        updated_at;
    `;
    const updatedAccount = updatedAccountResult[0];

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('[PATCH /api/accounts/:id]', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}
