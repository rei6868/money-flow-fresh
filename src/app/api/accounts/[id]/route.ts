import { sql } from '@/lib/db';
import { z } from 'zod';
import { CreateAccountSchema } from '@/lib/validation';
import { NextRequest } from 'next/server';
import { Account } from '@/types/database';

const UpdateAccountSchema = CreateAccountSchema.partial();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await sql`
      SELECT * FROM accounts WHERE account_id = ${id}
    `;
    const account = result[0] as Account;


    if (!account) {
      return Response.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    await sql`
      UPDATE accounts SET status = 'closed', updated_at = NOW() WHERE account_id = ${id}
    `;

    return Response.json({ success: true, message: 'Account closed' });

  } catch (error) {
    console.error('[DELETE /api/accounts/[id]]', error);
    return Response.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    // Validate input
    const validInput = UpdateAccountSchema.parse(body);

    const oldAccountResult = await sql`
      SELECT * FROM accounts WHERE account_id = ${id}
    `;
    const oldAccount = oldAccountResult[0] as Account;

    if (!oldAccount) {
      return Response.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const updates: { [key: string]: any } = {};
    for (const key in validInput) {
        if (Object.prototype.hasOwnProperty.call(validInput, key)) {
            const value = validInput[key as keyof typeof validInput];
            if (value !== undefined) {
                updates[key] = value;
            }
        }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { message: 'No fields to update', account: oldAccount },
        { status: 200 }
      );
    }

    const setClauses = Object.entries(updates).map(
      ([key, value]) => sql`${sql.unsafe(key)} = ${value}`
    );

    const updatedAccountResult = await sql`
      UPDATE accounts
      SET ${(sql as any).join(setClauses, sql`, `)}, updated_at = NOW()
      WHERE account_id = ${id}
      RETURNING *
    `;

    const updatedAccount = updatedAccountResult[0] as Account;

    return Response.json(updatedAccount);

  } catch (error) {
    if (error instanceof z.ZodError) {
        return Response.json(
            { error: 'Validation failed', details: error.flatten() },
            { status: 400 }
        );
    }
    console.error('[PATCH /api/accounts/[id]]', error);
    return Response.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}
