# Bug Investigation: Missing Material Details

## Problem
When editing a project, the material table shows:
- CODE: empty
- USAGE: empty (shows "e.g. Leg" placeholder)
- LEN (CM): empty
- COST/PC: 50 (showing correctly)
- QTY: 1 (showing correctly)
- TOTAL: 50 (showing correctly)

## Root Cause
The database stores materials with the OLD schema:
```json
{
  "calculatedCost": 50,
  "length": 0,
  "pricePerUnit": 0,
  "quantity": 1,
  "thickness": 0,
  "width": 0,
  "woodType": ""
}
```

But the NEW schema expects:
```json
{
  "code": "...",
  "description": "...",
  "usage": "...",
  "usedLength": 100,
  "refQty": 100,
  "cost": 50,
  "quantity": 1,
  "calculatedCost": 50
}
```

## Solution
1. ✅ Updated schema.ts to use new material structure
2. ✅ Updated routers.ts to validate new material structure
3. ✅ Updated ProjectContext.tsx to map materials correctly
4. ⚠️ EXISTING DATA in database still has old format - needs migration or UI to handle both formats
