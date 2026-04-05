import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Updated wood prices (new rates)
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

const NOTE_TEXT = '-ต่อราคาไม้ดิบมาได้ 2026/03\n-ต่อราคาลุงบานได้ 2026/03';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Get all วงกบประตู projects, excluding 70*200 and 80*200
  const [projects] = await conn.execute(
    `SELECT id, name, version, productionType, note, materials, carpenterCost, paintingCost, packingCost, wasteCost, channels, totalCost, userId
     FROM projects 
     WHERE name LIKE '%วงกบประตู%' 
     AND name NOT LIKE '%วงกบกลม%'
     AND name NOT LIKE '%70*200%' 
     AND name NOT LIKE '%80*200%'
     ORDER BY name, version`
  );

  console.log(`Found ${projects.length} versions of วงกบประตู (excluding วงกบกลม, 70*200 and 80*200)`);

  // Group by name to find latest versions
  const grouped = {};
  for (const p of projects) {
    if (!grouped[p.name]) grouped[p.name] = [];
    grouped[p.name].push(p);
  }

  console.log(`\nUnique SKU names: ${Object.keys(grouped).length}`);
  Object.keys(grouped).forEach(name => {
    const versions = grouped[name];
    const latest = versions.reduce((a, b) => Number(a.version) > Number(b.version) ? a : b);
    console.log(`  - ${name}: latest v.${latest.version} (${latest.productionType})`);
  });

  // Ask for confirmation
  console.log('\n=== Will create new versions for the above SKUs ===');
  console.log('Note to add:', NOTE_TEXT);
  console.log('\nProceeding with duplication...\n');

  let createdCount = 0;

  for (const [name, versions] of Object.entries(grouped)) {
    // Find latest version
    const latest = versions.reduce((a, b) => Number(a.version) > Number(b.version) ? a : b);
    const newVersion = Number(latest.version) + 1;

    // Parse materials and update wood prices
    let materials = latest.materials;
    if (typeof materials === 'string') materials = JSON.parse(materials);
    
    let woodCostChanged = false;
    const updatedMaterials = materials ? materials.map(m => {
      if (newWoodPrices[m.code] !== undefined && newWoodPrices[m.code] !== m.cost) {
        woodCostChanged = true;
        const newCost = newWoodPrices[m.code];
        // Recalculate calculatedCost proportionally
        // calculatedCost = (usedLength / refQty) * cost * quantity
        const ratio = m.refQty > 0 ? (m.usedLength || m.refQty) / m.refQty : 1;
        const newCalculatedCost = Math.ceil(ratio * newCost * (m.quantity || 1));
        return { ...m, cost: newCost, calculatedCost: newCalculatedCost };
      }
      return m;
    }) : materials;

    // Recalculate totalCost
    const woodTotal = updatedMaterials ? updatedMaterials.reduce((sum, m) => sum + (m.calculatedCost || 0), 0) : 0;
    const carpenterCost = parseFloat(latest.carpenterCost || 0);
    const paintingCost = parseFloat(latest.paintingCost || 0);
    const packingCost = parseFloat(latest.packingCost || 0);
    const wasteCost = parseFloat(latest.wasteCost || 0);
    const newTotalCost = woodTotal + carpenterCost + paintingCost + packingCost + wasteCost;

    // Parse channels
    let channels = latest.channels;
    if (typeof channels === 'string') channels = JSON.parse(channels);

    const newId = randomUUID();
    
    await conn.execute(
      `INSERT INTO projects (id, userId, name, version, productionType, note, materials, carpenterCost, paintingCost, packingCost, wasteCost, channels, totalCost, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        newId,
        latest.userId,
        name,
        newVersion,
        latest.productionType,
        NOTE_TEXT,
        JSON.stringify(updatedMaterials),
        carpenterCost,
        paintingCost,
        packingCost,
        wasteCost,
        JSON.stringify(channels),
        newTotalCost,
      ]
    );

    createdCount++;
    console.log(`✓ Created ${name} v.${newVersion} (${latest.productionType}) | TotalCost: ${latest.totalCost} -> ${newTotalCost} | Wood changed: ${woodCostChanged}`);
  }

  console.log(`\n✅ Done! Created ${createdCount} new versions.`);
  await conn.end();
}

main().catch(console.error);
