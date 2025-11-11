import { queryOne, sql } from '@/lib/db';
import { ApiUpdateAccountSchema } from '@/lib/validation';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = ApiUpdateAccountSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { accountName, accountType, status } = validation.data;

    const updates: { [key: string]: any } = {};
    if (accountName) updates.account_name = accountName;
    if (accountType) updates.account_type = accountType;
    if (status) updates.status = status;

    const updateFields = Object.keys(updates);
    if (updateFields.length === 0) {
      return Response.json({ message: 'No fields to update' }, { status: 200 });
    }

    const setClause = updateFields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');
    const queryParams = [id, ...Object.values(updates)];

    const updatedAccount = await queryOne(
      `UPDATE accounts SET ${setClause}, updated_at = NOW() WHERE account_id = $1 RETURNING *`,
      queryParams
    );

    if (!updatedAccount) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    return Response.json({
      accountId: id,
      updatedFields: updateFields,
      account: updatedAccount,
    }, { status: 200 });

  } catch (error) {
    console.error(`[PATCH /api/accounts/${(await (params as any))?.id}]`, error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
    }
    return Response.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Optional: Check for related transactions before deleting
    const relatedTransactions = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM transactions WHERE account_id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (parseInt(relatedTransactions?.count || '0', 10) > 0) {
      return Response.json(
        { error: 'Cannot delete account with active transactions. Please reassign or delete them first.' },
        { status: 409 } // 409 Conflict
      );
    }

    // Soft delete the account
    const result = await sql(
      "UPDATE accounts SET deleted_at = NOW(), status = 'closed' WHERE account_id = $1",
      [id]
    );

    if ((result as any).rowCount === 0) {
        return Response.json({ error: 'Account not found or already deleted' }, { status: 404 });
    }

    return Response.json({
      message: 'Account deleted successfully',
      id,
    }, { status: 200 });

  } catch (error) {
    console.error(`[DELETE /api/accounts/${(await (params as any))?.id}]`, error);
    return Response.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
