import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { z } from 'zod';

const CashbackFilterSchema = z.object({
  account_id: z.string().uuid().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const CreateCashbackSchema = z.object({
  accountId: z.string().uuid(),
  category: z.string(),
  amount: z.number().positive(),
  rate: z.number().optional(),
  earnedFrom: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const validation = CashbackFilterSchema.safeParse(Object.fromEntries(searchParams));

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
  }

  const { account_id, month, limit, offset } = validation.data;

  try {
    const conditions: any[] = [];
    if (account_id) conditions.push(sql`account_id = ${account_id}`);
    if (month) conditions.push(sql`to_char(created_at, 'YYYY-MM') = ${month}`);

    const whereClause = conditions.length > 0 ? sql`WHERE ${(sql as any).join(conditions, sql` AND `)}` : sql``;

    const [cashbackMovements, countResult, summaryResult] = await Promise.all([
        sql`
            SELECT * FROM cashback_movements
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `,
        sql`
            SELECT COUNT(*) as count FROM cashback_movements
            ${whereClause}
        `,
        sql`
            SELECT
                SUM(amount) as total_cashback,
                COUNT(*) as total_transactions
            FROM cashback_movements
            ${whereClause}
        `
    ]);

    const total = parseInt(countResult[0].count as string, 10);

    return NextResponse.json({
        data: cashbackMovements,
        summary: {
            total_cashback: summaryResult[0].total_cashback || 0,
            total_transactions: summaryResult[0].total_transactions || 0,
        },
        pagination: {
            limit,
            offset,
            total,
            hasMore: offset + limit < total,
        },
    });
  } catch (error) {
    console.error('[GET /api/cashback]', error);
    return NextResponse.json({ error: 'Failed to fetch cashback movements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CreateCashbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { accountId, category, amount, rate, earnedFrom } = validation.data;

    const newCashback = await sql`
      INSERT INTO cashback_movements (account_id, category, amount, rate, earned_from)
      VALUES (${accountId}, ${category}, ${amount}, ${rate}, ${earnedFrom})
      RETURNING *
    `;

    return NextResponse.json(newCashback[0], { status: 201 });
  } catch (error) {
    console.error('[POST /api/cashback]', error);
    return NextResponse.json({ error: 'Failed to record cashback' }, { status: 500 });
  }
}
