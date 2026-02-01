import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute('SELECT id, name, version, materials FROM projects LIMIT 3');
for (const row of rows) {
  console.log('---');
  console.log('ID:', row.id);
  console.log('Name:', row.name);
  console.log('Version:', row.version);
  console.log('Materials:', JSON.stringify(row.materials, null, 2));
}
await connection.end();
