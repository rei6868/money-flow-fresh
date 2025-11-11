import { queryMany, queryOne } from '@/lib/db';
import { GetPeopleQuerySchema } from '@/lib/validation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = GetPeopleQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid query parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { limit, offset } = validation.data;

    const dataQuery = `
      SELECT
        person_id as "personId",
        full_name as "personName",
        email,
        phone,
        role,
        created_at as "createdAt"
      FROM people
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const data = await queryMany(dataQuery, [limit, offset]);

    const countQuery = 'SELECT COUNT(*) as count FROM people';
    const countResult = await queryOne<{count: string}>(countQuery);
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
    console.error('[GET /api/people]', error);
    return Response.json(
      { error: 'Failed to fetch people' },
      { status: 500 }
    );
  }
}
