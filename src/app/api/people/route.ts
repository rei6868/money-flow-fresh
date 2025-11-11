import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { CreatePersonSchema } from '@/lib/people';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const [data, countResult] = await Promise.all([
      sql`
        SELECT
          person_id as id,
          full_name as person_name,
          contact_info,
          role,
          created_at,
          updated_at
        FROM people
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) as count FROM people
      `
    ]);

    const parsedData = data.map(item => {
        try {
            const contactInfo = JSON.parse(item.contact_info);
            return {
                id: item.id,
                person_name: item.person_name,
                email: contactInfo.email,
                phone: contactInfo.phone,
                role: item.role,
                created_at: item.created_at,
                updated_at: item.updated_at,
            }
        } catch (e) {
            return {
                id: item.id,
                person_name: item.person_name,
                email: null,
                phone: null,
                role: item.role,
                created_at: item.created_at,
                updated_at: item.updated_at,
            }
        }
    });

    const total = parseInt(countResult[0]?.count || '0', 10);

    return NextResponse.json({
      data: parsedData,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[GET /api/people]', error);
    return NextResponse.json(
      { error: 'Failed to fetch people' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CreatePersonSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { personName, email, phone, role } = validation.data;

    const contactInfo = JSON.stringify({ email, phone });

    const newPersonResult = await sql`
      INSERT INTO people (full_name, contact_info, role)
      VALUES (${personName}, ${contactInfo}, ${role})
      RETURNING
        person_id as id,
        full_name as person_name,
        contact_info,
        role,
        created_at,
        updated_at;
    `;
    const newPerson = newPersonResult[0];
    const parsedNewPerson = {
        id: newPerson.id,
        person_name: newPerson.person_name,
        email: email,
        phone: phone,
        role: newPerson.role,
        created_at: newPerson.created_at,
        updated_at: newPerson.updated_at,
    }

    return NextResponse.json(parsedNewPerson, { status: 201 });
  } catch (error) {
    console.error('[POST /api/people]', error);
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}
