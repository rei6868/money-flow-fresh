import { neon } from '@neondatabase/serverless';

async function describeTable(tableName) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = ${tableName};
    `;
    console.log(`\nSchema for table: ${tableName}`);
    console.table(columns);
  } catch (error) {
    console.error(`Error describing table ${tableName}:`, error);
  }
}

const tableName = process.argv[2];
if (tableName) {
  describeTable(tableName);
} else {
  console.log('Please provide a table name as an argument.');
}
