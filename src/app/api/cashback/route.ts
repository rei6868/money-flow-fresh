import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { CreateCashbackSchema } from '@/lib/cashback';

export async function GET(request: NextRequest) {
  try {
    const [data, summaryResult] = await Promise.all([
      sql`
        SELECT
          cashback_movement_id as id,
          account_id,
          note as category,
          cashback_amount as amount,
          null as rate,
          null as earned_from
        FROM cashback_movements
        ORDER BY created_at DESC
      `,
      sql`
        SELECT
          SUM(CASE WHEN status = 'applied' THEN cashback_amount ELSE 0 END) as total_earned,
          SUM(CASE WHEN status = 'init' THEN cashback_amount ELSE 0 END) as total_pending,
          SUM(CASE WHEN status = 'applied' THEN cashback_amount ELSE 0 END) as total_credited
        FROM cashback_movements
      `
    ]);

    const summary = summaryResult[0] || { total_earned: 0, total_pending: 0, total_credited: 0 };

    return NextResponse.json({
      data,
      summary
    });
  } catch (error) {
    console.error('[GET /api/cashback]', error);
    return NextResponse.json(
      { error: 'Failed to fetch cashback' },
      { status: 500 }
    );
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

    const newCashbackResult = await sql`
      INSERT INTO cashback_movements (account_id, note, cashback_amount, cashback_type, status)
      VALUES (${accountId}, ${category}, ${amount}, 'fixed', 'init')
      RETURNING
        cashback_movement_id as id,
        account_id,
        note as category,
        cashback_amount as amount,
        null as rate,
        null as earned_from;
    `;
    const newCashback = newCashbackResult[0];

    return NextResponse.json(newCashback, { status: 201 });
  } catch (error) {
    console.error('[POST /api/cashback]', error);
    return NextResponse.json({ error: 'Failed to create cashback' }, { status: 500 });
  }
}
