import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { z } from 'zod';

const DebtFilterSchema = z.object({
  account_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const CreateDebtSchema = z.object({
  debtorAccountId: z.string().uuid(),
  creditorPersonId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().optional(),
  dueDate: z.string().optional(),
});


export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const validation = DebtFilterSchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
    }

    const { account_id, person_id, status, limit, offset } = validation.data;

    try {
        const conditions: any[] = [];
        if (account_id) conditions.push(sql`debtor_account_id = ${account_id} OR creditor_account_id = ${account_id}`);
        if (person_id) conditions.push(sql`debtor_person_id = ${person_id} OR creditor_person_id = ${person_id}`);
        if (status) conditions.push(sql`status = ${status}`);

        const whereClause = conditions.length > 0 ? sql`WHERE ${(sql as any).join(conditions, sql` AND `)}` : sql``;

        const [debts, countResult] = await Promise.all([
            sql`
                SELECT * FROM debt_ledger
                ${whereClause}
                ORDER BY due_date DESC
                LIMIT ${limit} OFFSET ${offset}
            `,
            sql`
                SELECT COUNT(*) as count FROM debt_ledger
                ${whereClause}
            `
        ]);

        const total = parseInt(countResult[0].count as string, 10);

        return NextResponse.json({
            data: debts,
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + limit < total,
            },
        });
    } catch (error) {
        console.error('[GET /api/debt]', error);
        return NextResponse.json({ error: 'Failed to fetch debt records' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = CreateDebtSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
        }

        const { debtorAccountId, creditorPersonId, amount, reason, dueDate } = validation.data;

        const newDebt = await sql`
            INSERT INTO debt_ledger (debtor_account_id, creditor_person_id, amount, reason, due_date, status)
            VALUES (${debtorAccountId}, ${creditorPersonId}, ${amount}, ${reason}, ${dueDate}, 'open')
            RETURNING *
        `;

        return NextResponse.json(newDebt[0], { status: 201 });
    } catch (error) {
        console.error('[POST /api/debt]', error);
        return NextResponse.json({ error: 'Failed to create debt record' }, { status: 500 });
    }
}
