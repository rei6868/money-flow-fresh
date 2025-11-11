import { queryMany, queryOne } from '@/lib/db';

export async function GET(request: Request) {
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

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (accountId) {
      conditions.push(`account_id = $${paramIndex++}`);
      params.push(accountId);
    }

    if (personId) {
      conditions.push(`person_id = $${paramIndex++}`);
      params.push(personId);
    }

    if (type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(type);
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (fromDate) {
      conditions.push(`occurred_on >= $${paramIndex++}`);
      params.push(fromDate);
    }

    if (toDate) {
      conditions.push(`occurred_on <= $${paramIndex++}`);
      params.push(toDate);
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

    return Response.json({
      data,
      total: parseInt(countResult?.count || '0', 10),
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
