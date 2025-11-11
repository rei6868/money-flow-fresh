import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { UpdateDebtSchema } from '@/lib/debt';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = UpdateDebtSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { amount, status } = validation.data;

    const originalDebtResult = await sql`SELECT * FROM debt_ledger WHERE debt_ledger_id = ${id}`;
    if (originalDebtResult.length === 0) {
      return NextResponse.json({ error: 'Debt record not found' }, { status: 404 });
    }

    const updateFields: any[] = [];
    if (amount) updateFields.push(sql`net_debt = ${amount}`);
    if (status) updateFields.push(sql`status = ${status}`);

    const updatedDebtResult = await sql`
      UPDATE debt_ledger
      SET ${(sql as any).join(updateFields, sql`, `)}
      WHERE debt_ledger_id = ${id}
      RETURNING
        debt_ledger_id as id,
        person_id as creditor_person_id,
        net_debt as amount,
        notes as reason,
        last_updated as due_date,
        status;
    `;
    const updatedDebt = updatedDebtResult[0];

    return NextResponse.json(updatedDebt);
  } catch (error) {
    console.error('[PATCH /api/debt/:id]', error);
    return NextResponse.json({ error: 'Failed to update debt record' }, { status: 500 });
  }
}
