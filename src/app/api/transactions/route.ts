import { sql } from '@/lib/db';
import { ApiCreateTransactionSchema, GetTransactionsQuerySchema } from '@/lib/validation';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = GetTransactionsQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid query parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      account_id,
      person_id,
      type,
      status,
      category,
      date_from,
      date_to,
      limit,
      offset,
    } = validation.data;

    const conditions: any[] = [];
    if (account_id) conditions.push(sql`account_id = ${account_id}`);
    if (person_id) conditions.push(sql`person_id = ${person_id}`);
    if (type) conditions.push(sql`type = ${type}`);
    if (status) conditions.push(sql`status = ${status}`);
    if (category) conditions.push(sql`category_id = ${category}`);
    if (date_from) conditions.push(sql`occurred_on >= ${date_from}`);
    if (date_to) conditions.push(sql`occurred_on <= ${date_to}`);

    const whereClause = conditions.length > 0 ? sql`WHERE ${(sql as any).join(conditions, sql` AND `)}` : sql``;

    const [data, countResult] = await Promise.all([
      sql`
        SELECT * FROM transactions
        ${whereClause}
        ORDER BY occurred_on DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) as count FROM transactions
        ${whereClause}
      `
    ]);

    const count = countResult[0] as { count: string };
    const total = parseInt(count?.count || '0', 10);

    return Response.json({
      data,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      }
    });
  } catch (error) {
    console.error('[GET /api/transactions]', error);
    return Response.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ApiCreateTransactionSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      accountId,
      personId,
      type,
      amount,
      category,
      description,
      transactionDate,
      status,
    } = validation.data;

    const accountResult = await sql`
      SELECT account_id, current_balance FROM accounts WHERE account_id = ${accountId}
    `;
    const account = accountResult[0] as { account_id: string; current_balance: number };

    if (!account) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    const newTransactionId = randomUUID();

    const result = await sql`
      INSERT INTO transactions (transaction_id, account_id, person_id, type, amount, category_id, notes, occurred_on, status)
      VALUES (${newTransactionId}, ${accountId}, ${personId}, ${type}, ${amount}, ${category}, ${description}, ${transactionDate}, ${status})
      RETURNING *
    `;
    const newTransaction = result[0];

    const balanceChange = type === 'income' ? amount : -amount;

    await sql`
      UPDATE accounts SET current_balance = current_balance + ${balanceChange} WHERE account_id = ${accountId}
    `;

    return Response.json(newTransaction, { status: 201 });

  } catch (error) {
    console.error('[POST /api/transactions]', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
    }
    return Response.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
