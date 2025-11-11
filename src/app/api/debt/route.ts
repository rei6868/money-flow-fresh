import { queryMany, queryOne } from '@/lib/db';
import { ApiCreateDebtSchema, GetDebtQuerySchema } from '@/lib/validation';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = GetDebtQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid query parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      account_id,
      person_id,
      status,
      limit,
      offset,
    } = validation.data;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (account_id) {
      conditions.push(`debtor_account_id = $${paramIndex++}`);
      params.push(account_id);
    }

    if (person_id) {
        conditions.push(`creditor_person_id = $${paramIndex++}`);
        params.push(person_id);
    }

    if (status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const dataQuery = `
      SELECT
        debt_ledger_id as "debtId",
        debtor_account_id as "debtorAccountId",
        creditor_person_id as "creditorPersonId",
        amount,
        reason,
        due_date as "dueDate",
        status,
        created_at as "createdAt"
      FROM debt_ledger
      ${whereClause}
      ORDER BY due_date ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataParams = [...params, limit, offset];

    const countQuery = `SELECT COUNT(*) as count FROM debt_ledger ${whereClause}`;

    const data = await queryMany(dataQuery, dataParams);
    const countResult = await queryOne<{count: string}>(countQuery, params);
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
    console.error('[GET /api/debt]', error);
    return Response.json(
      { error: 'Failed to fetch debt records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ApiCreateDebtSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      debtorAccountId,
      creditorPersonId,
      amount,
      reason,
      dueDate,
    } = validation.data;

    // Check if account and person exist
    const account = await queryOne('SELECT account_id FROM accounts WHERE account_id = $1', [debtorAccountId]);
    if (!account) {
      return Response.json({ error: 'Debtor account not found' }, { status: 404 });
    }

    const person = await queryOne('SELECT person_id FROM people WHERE person_id = $1', [creditorPersonId]);
    if (!person) {
      return Response.json({ error: 'Creditor person not found' }, { status: 404 });
    }

    const debtId = randomUUID();

    const newDebt = await queryOne(
      `INSERT INTO debt_ledger (debt_ledger_id, debtor_account_id, creditor_person_id, amount, reason, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING
         debt_ledger_id as "debtId",
         debtor_account_id as "debtorAccountId",
         creditor_person_id as "creditorPersonId",
         amount,
         reason,
         due_date as "dueDate",
         status,
         created_at as "createdAt"`,
      [debtId, debtorAccountId, creditorPersonId, amount, reason, dueDate]
    );

    return Response.json(newDebt, { status: 201 });

  } catch (error) {
    console.error('[POST /api/debt]', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
    }
    return Response.json(
      { error: 'Failed to create debt record' },
      { status: 500 }
    );
  }
}
