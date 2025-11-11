import { sql } from '@/lib/db';
import { ApiUpdateTransactionSchema } from '@/lib/validation';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [transaction] = await sql`
      SELECT * FROM transactions WHERE transaction_id = ${id} AND deleted_at IS NULL
    `;

    if (!transaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transactionHistory = await sql`
      SELECT * FROM transaction_history WHERE transaction_id = ${id} ORDER BY "changedAt" DESC
    `;

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

    const originalTransactionResult = await sql`
      SELECT account_id, amount, type FROM transactions WHERE transaction_id = ${id} AND deleted_at IS NULL
    `;
    const originalTransaction = originalTransactionResult[0] as { account_id: string; amount: number; type: string; };


    if (!originalTransaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

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
        await sql`
          UPDATE accounts SET current_balance = current_balance + ${balanceDifference} WHERE account_id = ${accountId}
        `;
      }
    }

    const updates: { [key: string]: any } = {};
    if (type) updates.type = type;
    if (amount) updates.amount = amount;
    if (category) updates.category_id = category;
    if (description) updates.notes = description;
    if (status) updates.status = status;

    const updateFields = Object.keys(updates);
    if (updateFields.length > 0) {
      const setClauses = Object.entries(updates).map(
        ([key, value]) => sql`${sql.unsafe(key)} = ${value}`
      );

      await sql`
        UPDATE transactions
        SET ${(sql as any).join(setClauses, sql`, `)}, updated_at = NOW()
        WHERE transaction_id = ${id}
      `;
    }

    return Response.json({
      id,
      updatedFields: Object.keys(validation.data),
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

    const transactionResult = await sql`
      SELECT account_id, amount, type FROM transactions WHERE transaction_id = ${id} AND deleted_at IS NULL
    `;
    const transaction = transactionResult[0] as { account_id: string; amount: number; type: string; };

    if (!transaction) {
      return Response.json({ error: 'Transaction not found or already deleted' }, { status: 404 });
    }

    await sql`
      UPDATE transactions SET deleted_at = NOW(), status = 'void' WHERE transaction_id = ${id}
    `;

    const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;

    await sql`
      UPDATE accounts SET current_balance = current_balance + ${balanceChange} WHERE account_id = ${transaction.account_id}
    `;

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
