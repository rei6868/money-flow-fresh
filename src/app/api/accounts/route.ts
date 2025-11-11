import { z } from 'zod';
import { queryOne, queryMany } from '@/lib/db';
import { CreateAccountSchema } from '@/lib/validation';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. VALIDATE INPUT against CreateAccountSchema
    const validInput = CreateAccountSchema.parse(body);

    // 2. GENERATE account ID
    const accountId = crypto.randomUUID();

    // 3. BUILD INSERT query with plain placeholders
    const insertQuery = `
      INSERT INTO accounts (
        account_id,
        account_name,
        img_url,
        account_type,
        owner_id,
        parent_account_id,
        asset_ref,
        opening_balance,
        current_balance,
        status,
        total_in,
        total_out,
        notes,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
      )
      RETURNING *
    `;

    // 4. PREPARE parameters with plain strings for enums
    const params = [
      accountId,
      validInput.account_name,
      validInput.img_url || null,
      validInput.account_type, // Pass as plain string
      validInput.owner_id || null,
      validInput.parent_account_id || null,
      validInput.asset_ref || null,
      validInput.opening_balance || 0,
      validInput.current_balance || validInput.opening_balance || 0,
      validInput.status || 'active', // Pass as plain string
      validInput.total_in || 0,
      validInput.total_out || 0,
      validInput.notes || null
    ];

    // 5. EXECUTE insert
    const newAccount = await queryOne(insertQuery, params);

    if (!newAccount) {
      return Response.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // 6. RETURN created account
    return Response.json(newAccount, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      );
    }
    console.error('[POST /api/accounts]', error);
    return Response.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
