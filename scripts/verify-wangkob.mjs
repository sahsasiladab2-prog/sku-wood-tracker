import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// New wood prices
const newPrices = {
  '4c15200': 33, '3c15200': 23, '4s5200': 105, '4s6200': 115,
  '3s580': 15, '4s580': 30, '4s680': 40, '4s6100': 40
};

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  const sizes = ['70', '80', '90', '100', '160', '180', '200'];

  for (const size of sizes) {
    const name = `วงกบประตู ${size}*200`;
    const [rows] = await conn.execute(
      'SELECT version, materials, carpenterCost, paintingCost, packingCost, wasteCost, totalCost FROM projects WHERE name = ? ORDER BY version DESC LIMIT 1',
      [name]
    );
    if (!rows.length) { console.log(`${name}: NOT FOUND\n`); continue; }
    const r = rows[0];
    const mats = typeof r.materials === 'string' ? JSON.parse(r.materials) : r.materials;

    console.log(`${name} v.${r.version}:`);
    let woodTotal = 0;
    if (mats) {
      for (const m of mats) {
        const expectedCost = newPrices[m.code];
        const expectedCalcCost = expectedCost !== undefined ? expectedCost * m.quantity : null;
        const costOk = expectedCost === undefined || m.cost === expectedCost;
        const calcOk = expectedCalcCost === null || m.calculatedCost === expectedCalcCost;
        const status = (costOk && calcOk) ? '✅' : '❌';
        let msg = `  ${status} code=${m.code} qty=${m.quantity} cost=${m.cost}`;
        if (expectedCost !== undefined && !costOk) msg += ` (expected ${expectedCost})`;
        msg += ` calcCost=${m.calculatedCost}`;
        if (expectedCalcCost !== null && !calcOk) msg += ` (expected ${expectedCalcCost})`;
        console.log(msg);
        woodTotal += m.calculatedCost || 0;
      }
    }
    const storedTotal = parseFloat(r.totalCost);
    const calcTotal = woodTotal + parseFloat(r.carpenterCost) + parseFloat(r.paintingCost) + parseFloat(r.packingCost) + parseFloat(r.wasteCost);
    const totalOk = Math.abs(calcTotal - storedTotal) < 1;
    console.log(`  woodTotal=${woodTotal} carpenter=${r.carpenterCost} calcTotal=${calcTotal} storedTotal=${storedTotal} ${totalOk ? '✅' : '❌ MISMATCH'}`);
    console.log('');
  }

  await conn.end();
}

main().catch(console.error);
