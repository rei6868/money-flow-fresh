import { queryMany, queryOne, sql } from '@/lib/db';
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

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (account_id) {
      conditions.push(`account_id = $${paramIndex++}`);
      params.push(account_id);
    }

    if (person_id) {
      conditions.push(`person_id = $${paramIndex++}`);
      params.push(person_id);
    }

    if (type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(type);
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (category) {
        conditions.push(`category_id = $${paramIndex++}`);
        params.push(category);
    }

    if (date_from) {
      conditions.push(`occurred_on >= $${paramIndex++}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`occurred_on <= $${paramIndex++}`);
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataQuery = `
      SELECT * FROM transactions
      ${whereClause}
      ORDER BY occurred_on DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataParams = [...params, limit, offset];

    const countQuery = `SELECT COUNT(*) as count FROM transactions ${whereClause}`;

    const data = await queryMany(dataQuery, dataParams);
    const countResult = await queryOne<{count: string}>(countQuery, params);
    const total = parseInt(countResult?.count || '0', 10);

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

    // Check if account exists
    const account = await queryOne<{ account_id: string; current_balance: number }>(
      'SELECT account_id, current_balance FROM accounts WHERE account_id = $1',
      [accountId]
    );

    if (!account) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    const newTransactionId = randomUUID();

    // Insert new transaction
    const newTransaction = await queryOne(
      `INSERT INTO transactions (transaction_id, account_id, person_id, type, amount, category_id, notes, occurred_on, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        newTransactionId,
        accountId,
        personId,
        type,
        amount,
        category, // Assuming category string is stored in category_id for now
        description,
        transactionDate,
        status,
      ]
    );

    // Update account balance
    const balanceChange = type === 'income' ? amount : -amount;

    await sql(
      'UPDATE accounts SET current_balance = current_balance + $1 WHERE account_id = $2',
      [balanceChange, accountId]
    );

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
