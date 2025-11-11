import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { z } from 'zod';
import { TransactionTypeSchema, TransactionStatusSchema } from '@/lib/validation';

const UpdateTransactionBodySchema = z.object({
    type: TransactionTypeSchema.optional(),
    amount: z.number().positive().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    status: TransactionStatusSchema.optional(),
  });

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params;

      const [transactionResult, historyResult] = await Promise.all([
        sql`SELECT * FROM transactions WHERE id = ${id}`,
        sql`SELECT * FROM transaction_history WHERE transaction_id = ${id} ORDER BY changed_at DESC`
      ]);

      if (transactionResult.length === 0) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      return NextResponse.json({
        transaction: transactionResult[0],
        transaction_history: historyResult,
      });
    } catch (error) {
      console.error('[GET /api/transactions/:id]', error);
      return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
    }
  }

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = UpdateTransactionBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { type, amount, category, description, status } = validation.data;

    if (!type && !amount && !category && !description && !status) {
      return NextResponse.json({ error: 'At least one field to update is required' }, { status: 400 });
    }

    // Get the original transaction
    const originalTransactionResult = await sql`SELECT * FROM transactions WHERE id = ${id}`;
    if (originalTransactionResult.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    const originalTransaction = originalTransactionResult[0];

    const updateFields: any[] = [];
    if (type) updateFields.push(sql`type = ${type}`);
    if (amount) updateFields.push(sql`amount = ${amount}`);
    if (category) updateFields.push(sql`category = ${category}`);
    if (description) updateFields.push(sql`notes = ${description}`);
    if (status) updateFields.push(sql`status = ${status}`);


    const updatedTransaction = await sql`
      UPDATE transactions
      SET ${(sql as any).join(updateFields, sql`, `)}
      WHERE id = ${id}
      RETURNING *
    `;

    // Recalculate balance if amount changed
    if (amount && amount !== originalTransaction.amount) {
      const oldAmount = originalTransaction.type === 'income' ? originalTransaction.amount : -originalTransaction.amount;
      const newAmount = (type || originalTransaction.type) === 'income' ? amount : -amount;
      const balanceChange = newAmount - oldAmount;

      await sql`
        UPDATE accounts
        SET current_balance = current_balance + ${balanceChange}
        WHERE account_id = ${originalTransaction.account_id}
      `;
    }


    return NextResponse.json(updatedTransaction[0]);
  } catch (error) {
    console.error('[PATCH /api/transactions/:id]', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
      }
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params;

      // Get the original transaction
      const originalTransactionResult = await sql`SELECT * FROM transactions WHERE id = ${id}`;
      if (originalTransactionResult.length === 0) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      const originalTransaction = originalTransactionResult[0];

      // Soft delete the transaction
      await sql`
        UPDATE transactions
        SET deleted_at = NOW(), status = 'closed'
        WHERE id = ${id}
      `;

      // Reverse the balance impact
      const balanceChange = originalTransaction.type === 'income' ? -originalTransaction.amount : originalTransaction.amount;
      await sql`
        UPDATE accounts
        SET current_balance = current_balance + ${balanceChange}
        WHERE account_id = ${originalTransaction.account_id}
      `;

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error('[DELETE /api/transactions/:id]', error);
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
  }
