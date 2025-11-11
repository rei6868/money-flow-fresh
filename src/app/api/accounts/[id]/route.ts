import { queryOne, execute } from '@/lib/db';
import { z } from 'zod';
import { CreateAccountSchema } from '@/lib/validation';

const UpdateAccountSchema = CreateAccountSchema.partial();

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const account = await queryOne(
      'SELECT * FROM accounts WHERE account_id = $1',
      [id]
    );

    if (!account) {
      return Response.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Soft delete: set status to closed
    await execute(
      'UPDATE accounts SET status = $1, updated_at = NOW() WHERE account_id = $2',
      ['closed', id]
    );

    return Response.json({ success: true, message: 'Account closed' });

  } catch (error) {
    console.error('[DELETE /api/accounts/[id]]', error);
    return Response.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Validate input
    const validInput = UpdateAccountSchema.parse(body);

    // 1. GET old account
    const oldAccount = await queryOne(
      'SELECT * FROM accounts WHERE account_id = $1',
      [id]
    );

    if (!oldAccount) {
      return Response.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // 2. BUILD dynamic UPDATE
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    // Update only provided fields
    for (const key in validInput) {
        if (Object.prototype.hasOwnProperty.call(validInput, key)) {
            const value = validInput[key as keyof typeof validInput];
            if (value !== undefined) {
                updateFields.push(`${key} = $${paramIndex++}`);
                updateParams.push(value);
            }
        }
    }


    if (updateFields.length === 0) {
      return Response.json(
        { message: 'No fields to update', account: oldAccount },
        { status: 200 }
      );
    }

    updateFields.push(`updated_at = NOW()`);
    updateParams.push(id);

    const updateQuery = `UPDATE accounts SET ${updateFields.join(', ')} WHERE account_id = $${paramIndex} RETURNING *`;
    const updatedAccount = await queryOne(updateQuery, updateParams);

    return Response.json(updatedAccount);

  } catch (error) {
    if (error instanceof z.ZodError) {
        return Response.json(
            { error: 'Validation failed', details: error.flatten() },
            { status: 400 }
        );
    }
    console.error('[PATCH /api/accounts/[id]]', error);
    return Response.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}
