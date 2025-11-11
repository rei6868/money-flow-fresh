import { queryMany, queryOne, sql } from '@/lib/db';
import { ApiUpdateTransactionSchema } from '@/lib/validation';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await queryOne(
      'SELECT * FROM transactions WHERE transaction_id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (!transaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transactionHistory = await queryMany(
      'SELECT * FROM transaction_history WHERE transaction_id = $1 ORDER BY "changedAt" DESC',
      [id]
    );

    return Response.json({
      transaction,
      transactionHistory,
    });
  } catch (error) {
    console.error(`[GET /api/transactions/${(await (params as any))?.id}]`, error);
    return Response.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = ApiUpdateTransactionSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { type, amount, category, description, status } = validation.data;

    const originalTransaction = await queryOne<{
      account_id: string;
      amount: number;
      type: string;
    }>(
      'SELECT account_id, amount, type FROM transactions WHERE transaction_id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (!originalTransaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Recalculate balance if amount or type changes
    if (amount !== undefined || type !== undefined) {
      const oldAmount = originalTransaction.amount;
      const oldType = originalTransaction.type;
      const accountId = originalTransaction.account_id;

      const newType = type || oldType;
      const newAmount = amount || oldAmount;

      const oldBalanceEffect = oldType === 'income' ? oldAmount : -oldAmount;
      const newBalanceEffect = newType === 'income' ? newAmount : -newAmount;

      const balanceDifference = newBalanceEffect - oldBalanceEffect;

      if (balanceDifference !== 0) {
        await sql(
          'UPDATE accounts SET current_balance = current_balance + $1 WHERE account_id = $2',
          [balanceDifference, accountId]
        );
      }
    }

    const updates: { [key: string]: any } = {};
    if (type) updates.type = type;
    if (amount) updates.amount = amount;
    if (category) updates.category_id = category;
    if (description) updates.notes = description;
    if (status) updates.status = status;

    const updateFields = Object.keys(updates);
    if (updateFields.length === 0) {
      return Response.json({ message: 'No fields to update' }, { status: 200 });
    }

    const setClause = updateFields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');
    const queryParams = [...Object.values(updates), id];

    await sql(
      `UPDATE transactions SET ${setClause}, updated_at = NOW() WHERE transaction_id = $1`,
      queryParams
    );

    return Response.json({
      id,
      updatedFields: updateFields.map(f => f === 'category_id' ? 'category' : (f === 'notes' ? 'description' : f)),
      newValues: validation.data,
    }, { status: 200 });

  } catch (error) {
    console.error(`[PATCH /api/transactions/${(await (params as any))?.id}]`, error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
    }
    return Response.json(
      { error: 'Failed to update transaction' },
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

    const transaction = await queryOne<{
      account_id: string;
      amount: number;
      type: string;
    }>(
      'SELECT account_id, amount, type FROM transactions WHERE transaction_id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (!transaction) {
      return Response.json({ error: 'Transaction not found or already deleted' }, { status: 404 });
    }

    // Soft delete the transaction
    await sql(
      "UPDATE transactions SET deleted_at = NOW(), status = 'void' WHERE transaction_id = $1",
      [id]
    );

    // Reverse the transaction's impact on the account balance
    const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;

    await sql(
      'UPDATE accounts SET current_balance = current_balance + $1 WHERE account_id = $2',
      [balanceChange, transaction.account_id]
    );

    return Response.json({
      message: 'Transaction deleted successfully',
      id,
      reversedBalance: balanceChange,
    }, { status: 200 });

  } catch (error) {
    console.error(`[DELETE /api/transactions/${(await (params as any))?.id}]`, error);
    return Response.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
