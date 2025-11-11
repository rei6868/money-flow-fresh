import { queryOne, sql } from '@/lib/db';
import { ApiUpdateDebtSchema } from '@/lib/validation';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = ApiUpdateDebtSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, status } = validation.data;

    const updates: { [key: string]: any } = {};
    if (amount) updates.amount = amount;
    if (status) updates.status = status;

    const updateFields = Object.keys(updates);
    if (updateFields.length === 0) {
      return Response.json({ message: 'No fields to update' }, { status: 200 });
    }

    // If status is 'settled', create a debt_movement record
    if (status === 'settled') {
      const debt = await queryOne<{ debtor_account_id: string, creditor_person_id: string, amount: number }>(
        'SELECT debtor_account_id, creditor_person_id, amount FROM debt_ledger WHERE debt_ledger_id = $1',
        [id]
      );

      if (debt) {
        await sql(
          `INSERT INTO debt_movements (debt_movement_id, person_id, account_id, movement_type, amount, status)
           VALUES ($1, $2, $3, 'repay', $4, 'settled')`,
          [randomUUID(), debt.creditor_person_id, debt.debtor_account_id, debt.amount]
        );
      }
    }

    const setClause = updateFields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');
    const queryParams = [id, ...Object.values(updates)];

    const updatedDebt = await queryOne(
      `UPDATE debt_ledger SET ${setClause}, updated_at = NOW() WHERE debt_ledger_id = $1 RETURNING
        debt_ledger_id as "debtId",
        amount,
        status`,
      queryParams
    );

    if (!updatedDebt) {
      return Response.json({ error: 'Debt record not found' }, { status: 404 });
    }

    return Response.json({
      debtId: id,
      updatedFields,
      debt: updatedDebt,
    }, { status: 200 });

  } catch (error) {
    console.error(`[PATCH /api/debt/${(await (params as any))?.id}]`, error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
    }
    return Response.json(
      { error: 'Failed to update debt record' },
      { status: 500 }
    );
  }
}
