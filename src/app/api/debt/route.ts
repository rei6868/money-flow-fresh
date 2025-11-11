import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { CreateDebtSchema } from '@/lib/debt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const personId = searchParams.get('person_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const conditions: any[] = [];
    if (personId) conditions.push(sql`person_id = ${personId}`);
    if (status) conditions.push(sql`status = ${status}`);
    // A creative way to filter by debtor_account_id from the notes field
    if (accountId) conditions.push(sql`notes::jsonb @> ${JSON.stringify({ debtorAccountId: accountId })}::jsonb`);


    const whereClause = conditions.length > 0 ? sql`WHERE ${(sql as any).join(conditions, sql` AND `)}` : sql``;

    const [data, countResult] = await Promise.all([
      sql`
        SELECT
          debt_ledger_id as id,
          person_id as creditor_person_id,
          net_debt as amount,
          notes,
          last_updated as due_date,
          status
        FROM debt_ledger
        ${whereClause}
        ORDER BY last_updated DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      sql`
        SELECT COUNT(*) as count FROM debt_ledger
        ${whereClause}
      `
    ]);

    const parsedData = data.map(item => {
        try {
            const notesJson = JSON.parse(item.notes);
            return {
                id: item.id,
                debtor_account_id: notesJson.debtorAccountId,
                creditor_person_id: item.creditor_person_id,
                amount: item.amount,
                reason: notesJson.reason,
                due_date: item.due_date,
                status: item.status,
            }
        } catch (e) {
            return {
                id: item.id,
                debtor_account_id: null,
                creditor_person_id: item.creditor_person_id,
                amount: item.amount,
                reason: item.notes,
                due_date: item.due_date,
                status: item.status,
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
    console.error('[GET /api/debt]', error);
    return NextResponse.json(
      { error: 'Failed to fetch debt' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CreateDebtSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { debtorAccountId, creditorPersonId, amount, reason, dueDate } = validation.data;

    const notes = JSON.stringify({ reason, debtorAccountId });

    const newDebtResult = await sql`
      INSERT INTO debt_ledger (person_id, initial_debt, net_debt, notes, last_updated, status)
      VALUES (${creditorPersonId}, ${amount}, ${amount}, ${notes}, ${dueDate}, 'open')
      RETURNING
        debt_ledger_id as id,
        person_id as creditor_person_id,
        net_debt as amount,
        notes,
        last_updated as due_date,
        status;
    `;
    const newDebt = newDebtResult[0];
    const newDebtParsed = {
        id: newDebt.id,
        debtor_account_id: debtorAccountId,
        creditor_person_id: newDebt.creditor_person_id,
        amount: newDebt.amount,
        reason: reason,
        due_date: newDebt.due_date,
        status: newDebt.status,
    }

    return NextResponse.json(newDebtParsed, { status: 201 });
  } catch (error) {
    console.error('[POST /api/debt]', error);
    return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 });
  }
}
