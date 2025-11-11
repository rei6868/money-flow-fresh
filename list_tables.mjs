import { neon } from '@neondatabase/serverless';

async function listTables() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const tables = await sql`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname != 'pg_catalog' AND
            schemaname != 'information_schema';
    `;
    console.log(tables.map(t => t.tablename).join('\n'));
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

listTables();
