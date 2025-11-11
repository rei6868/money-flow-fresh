import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { CreateAccountSchema } from '@/lib/accounts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const [data, countResult] = await Promise.all([
      sql`
        SELECT
          account_id as id,
          account_name,
          account_type,
          current_balance,
          currency,
          status,
          created_at,
          updated_at
        FROM accounts
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) as count FROM accounts
      `
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return NextResponse.json({
      data,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[GET /api/accounts]', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CreateAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { accountName, accountType, currency, currentBalance } = validation.data;

    const newAccountResult = await sql`
      INSERT INTO accounts (account_name, account_type, currency, current_balance, status)
      VALUES (${accountName}, ${accountType}, ${currency}, ${currentBalance}, 'active')
      RETURNING account_id as id;
    `;
    const newAccount = newAccountResult[0];

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('[POST /api/accounts]', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
