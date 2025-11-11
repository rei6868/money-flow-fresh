import { z } from 'zod';
import { queryOne, queryMany } from '@/lib/db';
import { CreateAccountSchema } from '@/lib/validation';

export async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const owner_id = searchParams.get('owner_id');
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      // Base query for filtering
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (owner_id) {
        whereClause += ' AND owner_id = $' + (params.length + 1);
        params.push(owner_id);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM accounts ${whereClause}`;
      const countResult = (await queryOne(countQuery, params)) as { count: string };
      const total = parseInt(countResult?.count || '0', 10);

      // Get paginated data
      const dataQuery = `SELECT * FROM accounts ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      const dataParams = [...params, limit, offset];
      const accounts = await queryMany(dataQuery, dataParams);

      return Response.json({
        data: accounts,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      });

    } catch (error) {
      console.error('[GET /api/accounts]', error);
      return Response.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }
  }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = CreateAccountSchema.safeParse(body);

    if (!validation.success) {
      return Response.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const {
      accountName,
      accountType,
      openingBalance,
      currentBalance,
      currency,
      status,
      ownerId,
      parentAccountId,
      assetRef,
      imgUrl,
      notes,
      totalIn,
      totalOut,
    } = validation.data;

    const account_id = crypto.randomUUID();

    const newAccount = await queryOne(
      `
      INSERT INTO accounts (
        account_id, account_name, account_type, opening_balance, current_balance, currency, status, owner_id,
        parent_account_id, asset_ref, img_url, notes, total_in, total_out
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
      `,
      [
        account_id,
        accountName,
        accountType,
        openingBalance,
        currentBalance,
        currency,
        status,
        ownerId,
        parentAccountId,
        assetRef,
        imgUrl,
        notes,
        totalIn,
        totalOut,
      ]
    );

    return Response.json(newAccount, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
    }
    console.error('[POST /api/accounts]', error);
    return Response.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
