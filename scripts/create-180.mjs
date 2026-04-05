import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const NOTE_TEXT = '-ต่อราคาไม้ดิบมาได้ 2026/03\n-ต่อราคาลุงบานได้ 2026/03';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Get the latest version of วงกบประตู 160*200
  const [rows] = await conn.execute(
    `SELECT * FROM projects WHERE name = 'วงกบประตู 160*200' ORDER BY version DESC LIMIT 1`
  );

  if (rows.length === 0) {
    console.error('ไม่พบ วงกบประตู 160*200 ในระบบ');
    await conn.end();
    return;
  }

  const source = rows[0];
  console.log(`Source: วงกบประตู 160*200 v.${source.version} (${source.productionType})`);
  console.log(`TotalCost: ${source.totalCost}`);

  const newId = randomUUID();

  await conn.execute(
    `INSERT INTO projects (id, userId, name, version, productionType, note, materials, carpenterCost, paintingCost, packingCost, wasteCost, channels, totalCost, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      newId,
      source.userId,
      'วงกบประตู 180*200',
      1,
      source.productionType,
      NOTE_TEXT,
      typeof source.materials === 'string' ? source.materials : JSON.stringify(source.materials),
      source.carpenterCost,
      source.paintingCost,
      source.packingCost,
      source.wasteCost,
      typeof source.channels === 'string' ? source.channels : JSON.stringify(source.channels),
      source.totalCost,
    ]
  );

  console.log(`\n✅ Created วงกบประตู 180*200 v.1 (${source.productionType})`);
  console.log(`   TotalCost: ${source.totalCost}`);
  console.log(`   Note: ${NOTE_TEXT}`);

  await conn.end();
}

main().catch(console.error);
