import { sql } from '@/lib/db';
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

    if (status === 'settled') {
      const debtResult = await sql`
        SELECT debtor_account_id, creditor_person_id, amount FROM debt_ledger WHERE debt_ledger_id = ${id}
      `;
      const debt = debtResult[0] as { debtor_account_id: string, creditor_person_id: string, amount: number };

      if (debt) {
        await sql`
          INSERT INTO debt_movements (debt_movement_id, person_id, account_id, movement_type, amount, status)
          VALUES (${randomUUID()}, ${debt.creditor_person_id}, ${debt.debtor_account_id}, 'repay', ${debt.amount}, 'settled')
        `;
      }
    }

    const setClauses = Object.entries(updates).map(
      ([key, value]) => sql`${sql.unsafe(key)} = ${value}`
    );

    const result = await sql`
      UPDATE debt_ledger
      SET ${(sql as any).join(setClauses, sql`, `)}, updated_at = NOW()
      WHERE debt_ledger_id = ${id}
      RETURNING
        debt_ledger_id as "debtId",
        amount,
        status
    `;

    const updatedDebt = result[0];

    if (!updatedDebt) {
      return Response.json({ error: 'Debt record not found' }, { status: 404 });
    }

    return Response.json({
      debtId: id,
      updatedFields: Object.keys(validation.data),
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
