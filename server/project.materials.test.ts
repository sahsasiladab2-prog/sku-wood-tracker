import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Test the material schema validation
const materialSchema = z.object({
  code: z.string(),
  description: z.string(),
  usage: z.string(),
  usedLength: z.number(),
  refQty: z.number(),
  cost: z.number(),
  quantity: z.number(),
  calculatedCost: z.number(),
  unit: z.string().optional(),
  isCustom: z.boolean().optional(),
});

describe('Material Schema Validation', () => {
  it('should validate a complete material object', () => {
    const validMaterial = {
      code: '51100',
      description: '5 x 1"x 100',
      usage: 'Table Leg',
      usedLength: 100,
      refQty: 100,
      cost: 50,
      quantity: 2,
      calculatedCost: 100,
      unit: 'cm',
      isCustom: false,
    };

    const result = materialSchema.safeParse(validMaterial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('51100');
      expect(result.data.quantity).toBe(2);
      expect(result.data.calculatedCost).toBe(100);
    }
  });

  it('should validate a custom material object', () => {
    const customMaterial = {
      code: 'CUSTOM',
      description: 'Imported Item',
      usage: '',
      usedLength: 100,
      refQty: 100,
      cost: 50,
      quantity: 1,
      calculatedCost: 50,
      unit: 'cm',
      isCustom: true,
    };

    const result = materialSchema.safeParse(customMaterial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isCustom).toBe(true);
    }
  });

  it('should validate material without optional fields', () => {
    const minimalMaterial = {
      code: '51100',
      description: '5 x 1"x 100',
      usage: '',
      usedLength: 100,
      refQty: 100,
      cost: 50,
      quantity: 1,
      calculatedCost: 50,
    };

    const result = materialSchema.safeParse(minimalMaterial);
    expect(result.success).toBe(true);
  });

  it('should reject material with missing required fields', () => {
    const invalidMaterial = {
      code: '51100',
      // missing other required fields
    };

    const result = materialSchema.safeParse(invalidMaterial);
    expect(result.success).toBe(false);
  });
});

describe('Material Format Migration', () => {
  // Helper function to simulate the migration logic from Calculator.tsx
  function migrateOldFormat(m: any) {
    const isOldFormat = !m.code && (m.woodType !== undefined || m.thickness !== undefined);
    
    if (isOldFormat) {
      return {
        code: m.woodType || "CUSTOM",
        description: m.woodType || "Imported Item",
        unit: "cm",
        refQty: m.length || 100,
        cost: m.pricePerUnit || m.calculatedCost || 0,
        quantity: m.quantity || 1,
        usage: m.usage || "",
        usedLength: m.length || m.usedLength || 100,
        calculatedCost: m.calculatedCost || 0,
        isCustom: true,
      };
    }
    
    return {
      code: m.code || "",
      description: m.description || "",
      unit: m.unit || "cm",
      refQty: m.refQty || 100,
      cost: m.cost || 0,
      quantity: m.quantity || 1,
      usage: m.usage || "",
      usedLength: m.usedLength || m.refQty || 100,
      calculatedCost: m.calculatedCost || m.cost || 0,
      isCustom: m.isCustom || false,
    };
  }

  it('should migrate old format material to new format', () => {
    const oldFormatMaterial = {
      calculatedCost: 50,
      length: 0,
      pricePerUnit: 0,
      quantity: 1,
      thickness: 0,
      width: 0,
      woodType: "",
    };

    const migrated = migrateOldFormat(oldFormatMaterial);
    
    expect(migrated.code).toBe("CUSTOM");
    expect(migrated.description).toBe("Imported Item");
    expect(migrated.isCustom).toBe(true);
    expect(migrated.quantity).toBe(1);
    expect(migrated.calculatedCost).toBe(50);
  });

  it('should preserve new format material', () => {
    const newFormatMaterial = {
      code: '51100',
      description: '5 x 1"x 100',
      usage: 'Leg',
      usedLength: 100,
      refQty: 100,
      cost: 50,
      quantity: 2,
      calculatedCost: 100,
      unit: 'cm',
      isCustom: false,
    };

    const migrated = migrateOldFormat(newFormatMaterial);
    
    expect(migrated.code).toBe('51100');
    expect(migrated.description).toBe('5 x 1"x 100');
    expect(migrated.isCustom).toBe(false);
    expect(migrated.quantity).toBe(2);
    expect(migrated.calculatedCost).toBe(100);
  });
});
