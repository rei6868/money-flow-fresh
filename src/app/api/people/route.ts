import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { z } from 'zod';

const createPersonBodySchema = z.object({
  personName: z.string().min(1, 'Person name is required'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const [people, countResult] = await Promise.all([
        sql`
            SELECT * FROM people
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `,
        sql`
            SELECT COUNT(*) as count FROM people
        `
    ]);

    const total = parseInt(countResult[0].count as string, 10);

    return NextResponse.json({
      data: people,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[GET /api/people]', error);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createPersonBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { personName, email, phone, role } = validation.data;

    const newPerson = await sql`
      INSERT INTO people (full_name, email, phone, role)
      VALUES (${personName}, ${email}, ${phone}, ${role})
      RETURNING *
    `;

    return NextResponse.json(newPerson[0], { status: 201 });
  } catch (error) {
    console.error('[POST /api/people]', error);
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}
