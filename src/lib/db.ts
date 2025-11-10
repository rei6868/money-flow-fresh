// src/lib/db.ts

import { neon } from '@neondatabase/serverless';

// Setup SQL connection
export const sql = neon(process.env.DATABASE_URL!);

/**
 * Executes a query and returns the first row or null
 * @param query The SQL query to execute
 * @param params The parameters to pass to the query
 * @returns The first row of the result set, or null if there are no rows
 */
export async function queryOne<T>(
    query: string,
    params?: (string | number | boolean | null)[]
): Promise<T | null> {
    try {
        const result = await (sql.query as any)(query, params);
        return result.length > 0 ? (result[0] as T) : null;
    } catch (error) {
        console.error('Error executing queryOne:', error);
        throw error;
    }
}

/**
 * Executes a query and returns all rows
 * @param query The SQL query to execute
 * @param params The parameters to pass to the query
 * @returns An array of all rows in the result set
 */
export async function queryMany<T>(
    query: string,
    params?: (string | number | boolean | null)[]
): Promise<T[]> {
    try {
        const result = await (sql.query as any)(query, params);
        return result as T[];
    } catch (error) {
        console.error('Error executing queryMany:', error);
        throw error;
    }
}

/**
 * Executes a query and returns nothing
 * @param query The SQL query to execute
 * @param params The parameters to pass to the query
 */
export async function execute(
    query: string,
    params?: (string | number | boolean | null)[]
): Promise<void> {
    try {
        await (sql.query as any)(query, params);
    } catch (error) {
        console.error('Error executing execute:', error);
        throw error;
    }
}
