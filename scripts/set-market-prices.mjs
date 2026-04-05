import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

// Original prices from woodData.ts (prices before any edits this month)
const originalPrices = [
  { code: "2c15100", cost: 5 },
  { code: "3c15100", cost: 10 },
  { code: "4c15100", cost: 15 },
  { code: "5c15100", cost: 30 },
  { code: "3c17100", cost: 10 },
  { code: "4c1780", cost: 10 },
  { code: "4c17100", cost: 15 },
  { code: "5c17100", cost: 30 },
  { code: "3c15200", cost: 23 },
  { code: "4c15200", cost: 33 },
  { code: "4c17200", cost: 45 },
  { code: "4c2200", cost: 40 },
  { code: "5c15200", cost: 65 },
  { code: "6c15200", cost: 110 },
  { code: "216080", cost: 5 },
  { code: "21100", cost: 10 },
  { code: "21200", cost: 20 },
  { code: "251100", cost: 10 },
  { code: "3180", cost: 15 },
  { code: "31100", cost: 20 },
  { code: "31200", cost: 50 },
  { code: "4180", cost: 20 },
  { code: "41100", cost: 30 },
  { code: "41120", cost: 40 },
  { code: "41160", cost: 60 },
  { code: "41200", cost: 75 },
  { code: "41220", cost: 100 },
  { code: "41250", cost: 140 },
  { code: "41300", cost: 120 },
  { code: "5180", cost: 45 },
  { code: "51100", cost: 50 },
  { code: "51120", cost: 70 },
  { code: "51160", cost: 100 },
  { code: "51200", cost: 120 },
  { code: "51220", cost: 150 },
  { code: "51250", cost: 180 },
  { code: "51300", cost: 170 },
  { code: "6180", cost: 55 },
  { code: "61100", cost: 60 },
  { code: "61120", cost: 90 },
  { code: "61160", cost: 150 },
  { code: "61200", cost: 180 },
  { code: "61220", cost: 200 },
  { code: "61250", cost: 250 },
  { code: "61300", cost: 387 },
  { code: "2525200", cost: 70 },
  { code: "3380", cost: 80 },
  { code: "33100", cost: 80 },
  { code: "4480", cost: 110 },
  { code: "44100", cost: 120 },
  { code: "3s580", cost: 15 },
  { code: "3s5100", cost: 30 },
  { code: "3s5110", cost: 32 },
  { code: "3s5200", cost: 60 },
  { code: "35s5100", cost: 40 },
  { code: "35s5200", cost: 80 },
  { code: "4s550", cost: 20 },
  { code: "4s560", cost: 25 },
  { code: "4s580", cost: 30 },
  { code: "4s5100", cost: 50 },
  { code: "4s5200", cost: 105 },
  { code: "2280", cost: 15 },
  { code: "22100", cost: 20 },
  { code: "42100", cost: 80 },
  { code: "4s680", cost: 40 },
  { code: "4s6100", cost: 40 },
  { code: "4s6200", cost: 115 },
  { code: "315200", cost: 70 },
  { code: "415200", cost: 110 },
  { code: "415250", cost: 320 },
  { code: "515200", cost: 200 },
  { code: "515250", cost: 350 },
  { code: "515300", cost: 450 },
  { code: "615200", cost: 300 },
  { code: "615250", cost: 600 },
];

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  console.log("Connected to DB");

  let updated = 0;
  let skipped = 0;

  for (const item of originalPrices) {
    const [rows] = await conn.execute(
      "SELECT id, marketPrice FROM wood_materials WHERE code = ?",
      [item.code]
    );
    
    if (rows.length === 0) {
      console.log(`  SKIP (not found): ${item.code}`);
      skipped++;
      continue;
    }

    const row = rows[0];
    // Only set marketPrice if it's currently NULL (don't overwrite user-set values)
    if (row.marketPrice !== null) {
      console.log(`  SKIP (already set): ${item.code} = ฿${row.marketPrice}`);
      skipped++;
      continue;
    }

    await conn.execute(
      "UPDATE wood_materials SET marketPrice = ? WHERE code = ?",
      [item.cost, item.code]
    );
    console.log(`  SET: ${item.code} marketPrice = ฿${item.cost}`);
    updated++;
  }

  await conn.end();
  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
