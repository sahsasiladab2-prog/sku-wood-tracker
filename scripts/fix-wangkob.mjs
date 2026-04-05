import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const NOTE_TEXT = '-ต่อราคาไม้ดิบมาได้ 2026/03\n-ต่อราคาลุงบานได้ 2026/03';

// Updated wood prices
const newWoodPrices = {
  '4c15200': 33,
  '3c15200': 23,
  '4s5200': 105,
  '4s6200': 115,
  '3s580': 15,
  '4s580': 30,
  '4s680': 40,
  '4s6100': 40,
};

// carpenterCost by size
const carpenterCostBySize = {
  '70': 130,
  '80': 130,
  '90': 130,
  '100': 130,
  '160': 170,
  '180': 170,
  '200': 170,
};

function getSizeKey(name) {
  const match = name.match(/(\d+)\*200/);
  return match ? match[1] : null;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // ===== STEP 1: Fix 180*200 duplicate =====
  console.log('=== STEP 1: Fix วงกบประตู 180*200 duplicate ===');

  // Get all 180*200 versions
  const [rows180] = await conn.execute(
    `SELECT id, name, version, note, materials, carpenterCost, paintingCost, packingCost, wasteCost, channels, totalCost, userId
     FROM projects WHERE name = 'วงกบประตู 180*200' ORDER BY version`
  );
  console.log(`Found ${rows180.length} versions of วงกบประตู 180*200:`);
  rows180.forEach(r => console.log(`  v.${r.version} | note: ${r.note ? r.note.substring(0, 40) : '(none)'} | totalCost: ${r.totalCost}`));

  // Find the duplicate v.1 I created (the one with the new note)
  const duplicateV1 = rows180.find(r => r.version === 1 && r.note && r.note.includes('2026/03'));
  const originalV1 = rows180.find(r => r.version === 1 && (!r.note || !r.note.includes('2026/03')));

  if (duplicateV1) {
    console.log(`\nDeleting duplicate v.1 (id: ${duplicateV1.id}) with note: ${duplicateV1.note}`);
    await conn.execute(`DELETE FROM projects WHERE id = ?`, [duplicateV1.id]);
    console.log('✓ Deleted duplicate v.1');
  } else {
    console.log('No duplicate v.1 found with new note');
  }

  // Now create v.2 based on original v.1 with updated wood prices
  if (originalV1) {
    let materials = typeof originalV1.materials === 'string' ? JSON.parse(originalV1.materials) : originalV1.materials;
    
    // Update wood prices
    const updatedMaterials = materials ? materials.map(m => {
      if (newWoodPrices[m.code] !== undefined) {
        const newCost = newWoodPrices[m.code];
        // Recalculate: calcCost = ceil((usedLength / refQty) * newCost * quantity)
        // From data: usedLength=200, qty=3, refQty=200 → ratio=1 → calcCost = newCost * qty
        // But looking at data: qty=3, calcCost=120 (not 360) so it seems calcCost = cost (per piece, not total)
        // Let's use the same ratio as original: newCalcCost = (m.calculatedCost / m.cost) * newCost
        const ratio = m.cost > 0 ? m.calculatedCost / m.cost : 1;
        const newCalculatedCost = Math.ceil(ratio * newCost);
        return { ...m, cost: newCost, calculatedCost: newCalculatedCost };
      }
      return m;
    }) : materials;

    // Recalculate totalCost with new carpenter cost for 180 = 170
    const woodTotal = updatedMaterials ? updatedMaterials.reduce((sum, m) => sum + (m.calculatedCost || 0), 0) : 0;
    const newCarpenterCost = 170;
    const paintingCost = parseFloat(originalV1.paintingCost || 0);
    const packingCost = parseFloat(originalV1.packingCost || 0);
    const wasteCost = parseFloat(originalV1.wasteCost || 0);
    const newTotalCost = woodTotal + newCarpenterCost + paintingCost + packingCost + wasteCost;

    let channels = typeof originalV1.channels === 'string' ? JSON.parse(originalV1.channels) : originalV1.channels;

    const newId = randomUUID();
    await conn.execute(
      `INSERT INTO projects (id, userId, name, version, productionType, note, materials, carpenterCost, paintingCost, packingCost, wasteCost, channels, totalCost, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        newId,
        originalV1.userId,
        'วงกบประตู 180*200',
        2,
        'Outsource',
        NOTE_TEXT,
        JSON.stringify(updatedMaterials),
        newCarpenterCost,
        paintingCost,
        packingCost,
        wasteCost,
        JSON.stringify(channels),
        newTotalCost,
      ]
    );
    console.log(`✓ Created วงกบประตู 180*200 v.2 | woodTotal=${woodTotal} | carpenterCost=${newCarpenterCost} | TotalCost=${newTotalCost}`);
  }

  // ===== STEP 2: Update carpenterCost for all latest versions =====
  console.log('\n=== STEP 2: Update carpenterCost for all latest versions ===');

  const sizes = ['70', '80', '90', '100', '160', '180', '200'];
  
  for (const size of sizes) {
    const skuName = `วงกบประตู ${size}*200`;
    const newCarpenter = carpenterCostBySize[size];

    // Get latest version
    const [latestRows] = await conn.execute(
      `SELECT id, version, carpenterCost, paintingCost, packingCost, wasteCost, materials, totalCost
       FROM projects WHERE name = ? ORDER BY version DESC LIMIT 1`,
      [skuName]
    );

    if (latestRows.length === 0) {
      console.log(`  ⚠️  ${skuName}: not found`);
      continue;
    }

    const latest = latestRows[0];
    const oldCarpenter = parseFloat(latest.carpenterCost);
    
    // Recalculate totalCost
    const materials = typeof latest.materials === 'string' ? JSON.parse(latest.materials) : latest.materials;
    const woodTotal = materials ? materials.reduce((sum, m) => sum + (m.calculatedCost || 0), 0) : 0;
    const paintingCost = parseFloat(latest.paintingCost || 0);
    const packingCost = parseFloat(latest.packingCost || 0);
    const wasteCost = parseFloat(latest.wasteCost || 0);
    const newTotalCost = woodTotal + newCarpenter + paintingCost + packingCost + wasteCost;

    await conn.execute(
      `UPDATE projects SET carpenterCost = ?, totalCost = ?, updatedAt = NOW() WHERE id = ?`,
      [newCarpenter, newTotalCost, latest.id]
    );

    console.log(`  ✓ ${skuName} v.${latest.version}: carpenterCost ${oldCarpenter} → ${newCarpenter} | totalCost ${latest.totalCost} → ${newTotalCost}`);
  }

  console.log('\n✅ All done!');
  await conn.end();
}

main().catch(console.error);
