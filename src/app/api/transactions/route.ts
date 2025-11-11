import { sql } from '@/lib/db';
import { NextRequest } from 'next/server';

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

    return Response.json({
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  } catch (error) {
    console.error('[GET /api/transactions]', error);
    return Response.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
