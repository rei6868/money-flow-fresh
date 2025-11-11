import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TransactionTypeSchema, TransactionStatusSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const personId = searchParams.get('person_id');

    const conditions: any[] = [];
    if (accountId) conditions.push(sql`account_id = ${accountId}`);
    if (personId) conditions.push(sql`person_id = ${personId}`);
    if (type) conditions.push(sql`type = ${type}`);
    if (status) conditions.push(sql`status = ${status}`);
    if (fromDate) conditions.push(sql`occurred_on >= ${fromDate}`);
    if (toDate) conditions.push(sql`occurred_on <= ${toDate}`);

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

const CreateTransactionBodySchema = z.object({
    accountId: z.string().uuid('Invalid account ID'),
    personId: z.string().uuid().optional().nullable(),
    type: TransactionTypeSchema,
    amount: z.number().positive('Amount must be positive'),
    category: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    transactionDate: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Invalid date format, expected YYYY-MM-DD",
    }),
    status: TransactionStatusSchema.default('active'),
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CreateTransactionBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { accountId, personId, type, amount, category, description, transactionDate, status } = validation.data;

    // Mapping to snake_case
    const account_id = accountId;
    const person_id = personId;
    const occurred_on = transactionDate;
    const notes = description;

    // Check if account exists
    const accountResult = await sql`SELECT * FROM accounts WHERE account_id = ${account_id}`;
    if (accountResult.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Insert transaction
    const newTransactionResult = await sql`
      INSERT INTO transactions (account_id, person_id, type, amount, category, notes, occurred_on, status)
      VALUES (${account_id}, ${person_id}, ${type}, ${amount}, ${category}, ${notes}, ${occurred_on}, ${status})
      RETURNING *
    `;
    const newTransaction = newTransactionResult[0];

    // Recalculate account balance
    const balanceUpdate = type === 'income' ? amount : -amount;
    await sql`
      UPDATE accounts
      SET current_balance = current_balance + ${balanceUpdate}
      WHERE account_id = ${account_id}
    `;

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error('[POST /api/transactions]', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
