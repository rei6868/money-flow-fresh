import { z } from 'zod';
import { queryOne, queryMany } from '@/lib/db';
import { ApiCreateAccountSchema } from '@/lib/validation';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner_id = searchParams.get('owner_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // BUILD query with filters
    let query = 'SELECT * FROM accounts WHERE 1=1';
    const params: any[] = [];

    if (owner_id) {
      query += ' AND owner_id = $' + (params.length + 1);
      params.push(owner_id);
    }

    // PAGINATION
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    // FETCH accounts
    const accounts = await queryMany(query, params);

    return Response.json({
      data: accounts,
      limit,
      offset
    });

  } catch (error) {
    console.error('[GET /api/accounts]', error);
    return Response.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ApiCreateAccountSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { accountName, accountType, currency, currentBalance } = validation.data;
    const accountId = randomUUID();

    const newAccount = await queryOne(
      `INSERT INTO accounts (account_id, account_name, account_type, currency, current_balance, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING account_id, account_name, account_type, current_balance, currency, status, created_at`,
      [accountId, accountName, accountType, currency, currentBalance]
    );

    return Response.json(newAccount, { status: 201 });

  } catch (error) {
    console.error('[POST /api/accounts]', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
    }
    return Response.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
