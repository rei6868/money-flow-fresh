import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { CreateTransactionSchema } from '@/lib/transactions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const personId = searchParams.get('person_id');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const conditions: any[] = [];
    if (accountId) conditions.push(sql`account_id = ${accountId}`);
    if (personId) conditions.push(sql`person_id = ${personId}`);
    if (type) conditions.push(sql`type = ${type}`);
    if (status) conditions.push(sql`status = ${status}`);
    if (category) conditions.push(sql`category_id = (SELECT category_id FROM categories WHERE name = ${category})`);
    if (dateFrom) conditions.push(sql`occurred_on >= ${dateFrom}`);
    if (dateTo) conditions.push(sql`occurred_on <= ${dateTo}`);

    const whereClause = conditions.length > 0 ? sql`WHERE ${(sql as any).join(conditions, sql` AND `)}` : sql``;

    const [data, countResult] = await Promise.all([
      sql`
        SELECT
          transaction_id as id,
          account_id,
          person_id,
          type,
          amount,
          (SELECT name FROM categories WHERE category_id = transactions.category_id) as category,
          notes as description,
          occurred_on as transaction_date,
          status,
          created_at,
          updated_at
        FROM transactions
        ${whereClause}
        ORDER BY occurred_on DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) as count FROM transactions
        ${whereClause}
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
    console.error('[GET /api/transactions]', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CreateTransactionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { accountId, personId, type, amount, category, description, transactionDate, status } = validation.data;

    const newTransactionResult = await sql`
      INSERT INTO transactions (account_id, person_id, type, amount, category_id, notes, occurred_on, status)
      VALUES (${accountId}, ${personId}, ${type}, ${amount}, (SELECT category_id FROM categories WHERE name = ${category}), ${description}, ${transactionDate}, ${status})
      RETURNING
        transaction_id as id,
        account_id,
        person_id,
        type,
        amount,
        (SELECT name FROM categories WHERE category_id = transactions.category_id) as category,
        notes as description,
        occurred_on as transaction_date,
        status,
        created_at,
        updated_at;
    `;
    const newTransaction = newTransactionResult[0];

    // Recalculate account balance
    const balanceUpdate = type === 'income' ? amount : -amount;
    await sql`
      UPDATE accounts
      SET current_balance = current_balance + ${balanceUpdate}
      WHERE account_id = ${accountId}
    `;

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error('[POST /api/transactions]', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
