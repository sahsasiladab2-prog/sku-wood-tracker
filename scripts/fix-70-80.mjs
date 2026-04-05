import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const newPrices = {
  '4s6200': 115,
  '4s680': 40,
};

async function fixSku(conn, name) {
  const [rows] = await conn.execute(
    'SELECT id, version, materials, carpenterCost, paintingCost, packingCost, wasteCost, totalCost FROM projects WHERE name = ? ORDER BY version DESC LIMIT 1',
    [name]
  );
  if (!rows.length) { console.log(`${name}: NOT FOUND`); return; }
  const r = rows[0];
  const mats = typeof r.materials === 'string' ? JSON.parse(r.materials) : r.materials;

  const updatedMats = mats.map(m => {
    if (newPrices[m.code] !== undefined) {
      const newCost = newPrices[m.code];
      const newCalcCost = newCost * m.quantity;
      return { ...m, cost: newCost, calculatedCost: newCalcCost };
    }
    return m;
  });

  const woodTotal = updatedMats.reduce((s, m) => s + (m.calculatedCost || 0), 0);
  const newTotalCost = woodTotal + parseFloat(r.carpenterCost) + parseFloat(r.paintingCost) + parseFloat(r.packingCost) + parseFloat(r.wasteCost);

  await conn.execute(
    'UPDATE projects SET materials=?, totalCost=?, updatedAt=NOW() WHERE id=?',
    [JSON.stringify(updatedMats), newTotalCost, r.id]
  );

  console.log(`✅ ${name} v.${r.version}: woodTotal=${woodTotal} carpenter=${r.carpenterCost} totalCost=${r.totalCost} → ${newTotalCost}`);
  updatedMats.forEach(m => console.log(`   code=${m.code} qty=${m.quantity} cost=${m.cost} calcCost=${m.calculatedCost}`));
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  await fixSku(conn, 'วงกบประตู 70*200');
  await fixSku(conn, 'วงกบประตู 80*200');
  await conn.end();
  console.log('\n✅ Done!');
}

main().catch(console.error);
