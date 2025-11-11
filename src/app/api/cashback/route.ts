import { queryMany, queryOne } from '@/lib/db';
import { ApiCreateCashbackSchema, GetCashbackQuerySchema } from '@/lib/validation';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = GetCashbackQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid query parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { account_id, month } = validation.data;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (account_id) {
      conditions.push(`account_id = $${paramIndex++}`);
      params.push(account_id);
    }

    if (month) {
      conditions.push(`to_char(earned_date, 'YYYY-MM') = $${paramIndex++}`);
      params.push(month);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataQuery = `
      SELECT
        cashback_movement_id as "cashbackId",
        account_id as "accountId",
        category,
        amount,
        rate,
        earned_from as "earnedFrom",
        earned_date as "earnedDate",
        status
      FROM cashback_movements
      ${whereClause}
      ORDER BY earned_date DESC
    `;

    const data = await queryMany(dataQuery, params);

    const summaryQuery = `
      SELECT
        COALESCE(SUM(amount), 0) as "totalEarned",
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as "totalPending",
        COALESCE(SUM(CASE WHEN status = 'credited' THEN amount ELSE 0 END), 0) as "totalCredited"
      FROM cashback_movements
      ${whereClause}
    `;

    const summary = await queryOne(summaryQuery, params);

    return Response.json({ data, summary });

  } catch (error) {
    console.error('[GET /api/cashback]', error);
    return Response.json(
      { error: 'Failed to fetch cashback movements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ApiCreateCashbackSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { accountId, category, amount, rate, earnedFrom } = validation.data;

    // Check if account exists
    const account = await queryOne('SELECT account_id FROM accounts WHERE account_id = $1', [accountId]);
    if (!account) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    const cashbackId = randomUUID();

    const newCashback = await queryOne(
      `INSERT INTO cashback_movements (cashback_movement_id, account_id, category, amount, rate, earned_from, status, earned_date)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
       RETURNING
         cashback_movement_id as "cashbackId",
         account_id as "accountId",
         category,
         amount,
         rate,
         status,
         earned_date as "earnedDate"`,
      [cashbackId, accountId, category, amount, rate, earnedFrom]
    );

    return Response.json(newCashback, { status: 201 });

  } catch (error) {
    console.error('[POST /api/cashback]', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
    }
    return Response.json(
      { error: 'Failed to create cashback record' },
      { status: 500 }
    );
  }
}
