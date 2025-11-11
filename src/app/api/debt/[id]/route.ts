import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { z } from 'zod';

const UpdateDebtSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.enum(['open', 'partial', 'repaid', 'overdue']).optional(),
});

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

    if (!amount && !status) {
      return NextResponse.json({ error: 'At least one field to update is required' }, { status: 400 });
    }

    const updateFields: any[] = [];
    if (amount) updateFields.push(sql`amount = ${amount}`);
    if (status) updateFields.push(sql`status = ${status}`);

    const updatedDebt = await sql`
      UPDATE debt_ledger
      SET ${(sql as any).join(updateFields, sql`, `)}
      WHERE id = ${id}
      RETURNING *
    `;

    if (updatedDebt.length === 0) {
      return NextResponse.json({ error: 'Debt record not found' }, { status: 404 });
    }

    return NextResponse.json(updatedDebt[0]);
  } catch (error) {
    console.error('[PATCH /api/debt/:id]', error);
    return NextResponse.json({ error: 'Failed to update debt record' }, { status: 500 });
  }
}
