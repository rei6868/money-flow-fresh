import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { UpdateTransactionSchema } from '@/lib/transactions';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params;

      const [transactionResult, historyResult] = await Promise.all([
        sql`
          SELECT
            transaction_id as id,
            account_id,
            person_id,
            type,
            amount,
            (SELECT name FROM categories WHERE category_id = transactions.category_id) as category,
            notes as description,
            occurred_on as transaction_date,
            status,
            created_at,
            updated_at
          FROM transactions
          WHERE transaction_id = ${id}`,
        sql`
          SELECT
            history_id as id,
            transaction_id,
            action_type as action,
            null as previous_values,
            '{}'::jsonb as new_values,
            created_at as changed_at
          FROM transaction_history
          WHERE transaction_id = ${id}
          ORDER BY created_at DESC`
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
    const validation = UpdateTransactionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { type, amount, category, description, status } = validation.data;

    const originalTransactionResult = await sql`SELECT * FROM transactions WHERE transaction_id = ${id}`;
    if (originalTransactionResult.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    const originalTransaction = originalTransactionResult[0];

    const updateFields: any[] = [];
    if (type) updateFields.push(sql`type = ${type}`);
    if (amount) updateFields.push(sql`amount = ${amount}`);
    if (category) updateFields.push(sql`category_id = (SELECT category_id FROM categories WHERE name = ${category})`);
    if (description) updateFields.push(sql`notes = ${description}`);
    if (status) updateFields.push(sql`status = ${status}`);


    const updatedTransactionResult = await sql`
      UPDATE transactions
      SET ${(sql as any).join(updateFields, sql`, `)}
      WHERE transaction_id = ${id}
      RETURNING
        transaction_id as id,
        account_id,
        person_id,
        type,
        amount,
        (SELECT name FROM categories WHERE category_id = transactions.category_id) as category,
        notes as description,
        occurred_on as transaction_date,
        status,
        created_at,
        updated_at;
    `;
    const updatedTransaction = updatedTransactionResult[0];

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

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('[PATCH /api/transactions/:id]', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params;

      const originalTransactionResult = await sql`SELECT * FROM transactions WHERE transaction_id = ${id}`;
      if (originalTransactionResult.length === 0) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      const originalTransaction = originalTransactionResult[0];

      await sql`
        UPDATE transactions
        SET deleted_at = NOW(), status = 'closed'
        WHERE transaction_id = ${id}
      `;

      const balanceChange = originalTransaction.type === 'income' ? -originalTransaction.amount : originalTransaction.amount;
      await sql`
        UPDATE accounts
        SET current_balance = current_balance + ${balanceChange}
        WHERE account_id = ${originalTransaction.account_id}
      `;

      return new NextResponse(null, { status: 200 });
    } catch (error) {
      console.error('[DELETE /api/transactions/:id]', error);
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
  }
