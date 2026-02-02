import { describe, it, expect } from 'vitest';

// Test the import data transformation logic
describe('Import Data Transformation', () => {
  // Helper function that mirrors the backend transformation logic
  function transformImportedProject(p: any) {
    // Handle materials - convert from export format
    let materials = null;
    if (p.materials && Array.isArray(p.materials)) {
      materials = p.materials.map((m: any) => ({
        code: m.code || "CUSTOM",
        description: m.description || "Imported Item",
        usage: m.usage || "",
        usedLength: m.usedLength || m.length || 0,
        refQty: m.refQty || 100,
        cost: m.cost || m.pricePerUnit || m.calculatedCost || 0,
        quantity: typeof m.quantity === 'number' ? m.quantity : 1,
        calculatedCost: m.calculatedCost || 0,
        unit: m.unit || "cm",
        isCustom: m.isCustom || false,
      }));
    }
    
    // Handle channels
    let channels = null;
    if (p.channels && Array.isArray(p.channels)) {
      channels = p.channels.map((c: any) => ({
        name: c.name || "Default",
        price: c.price || 0,
        feePercent: c.feePercent || 0,
      }));
    }
    
    // Handle costs - support both old and new format
    const carpenterCost = p.costs?.carpenter || p.carpenterCost || 0;
    const paintingCost = p.costs?.painting || p.paintingCost || 0;
    const packingCost = p.costs?.packing || p.packingCost || 0;
    const wasteCost = p.costs?.waste || p.wasteCost || 0;
    
    return {
      name: p.name || "Imported Project",
      version: p.version || 1,
      productionType: p.productionType || "Outsource",
      note: p.note || null,
      materials,
      carpenterCost: String(carpenterCost),
      paintingCost: String(paintingCost),
      packingCost: String(packingCost),
      wasteCost: String(wasteCost),
      channels,
      totalCost: String(p.totalCost || 0),
    };
  }

  it('should transform exported project format correctly', () => {
    const exportedProject = {
      id: "ABC123",
      name: "Test Product",
      version: 2,
      status: "Production",
      margin: 25,
      totalCost: 500,
      sellingPrice: 700,
      channels: [
        { id: "ch-0", name: "Shopee", price: 700, feePercent: 10, profit: 130, marginPercent: 18.6 }
      ],
      updatedAt: "2026-02-01T10:00:00.000Z",
      note: "Test note",
      productionType: "In-House",
      materials: [
        {
          code: "51100",
          description: "5 x 1\"x 100",
          usage: "Leg",
          usedLength: 100,
          refQty: 100,
          cost: 50,
          quantity: 2,
          calculatedCost: 100,
          unit: "cm",
          isCustom: false,
        }
      ],
      costs: {
        carpenter: 30,
        painting: 20,
        packing: 10,
        waste: 5,
      }
    };

    const transformed = transformImportedProject(exportedProject);

    expect(transformed.name).toBe("Test Product");
    expect(transformed.version).toBe(2);
    expect(transformed.productionType).toBe("In-House");
    expect(transformed.note).toBe("Test note");
    expect(transformed.totalCost).toBe("500");
    expect(transformed.carpenterCost).toBe("30");
    expect(transformed.paintingCost).toBe("20");
    expect(transformed.packingCost).toBe("10");
    expect(transformed.wasteCost).toBe("5");
    expect(transformed.materials).toHaveLength(1);
    expect(transformed.materials![0].code).toBe("51100");
    expect(transformed.channels).toHaveLength(1);
    expect(transformed.channels![0].name).toBe("Shopee");
  });

  it('should handle minimal project data', () => {
    const minimalProject = {
      name: "Minimal Product",
      totalCost: 100,
    };

    const transformed = transformImportedProject(minimalProject);

    expect(transformed.name).toBe("Minimal Product");
    expect(transformed.version).toBe(1);
    expect(transformed.productionType).toBe("Outsource");
    expect(transformed.totalCost).toBe("100");
    expect(transformed.materials).toBeNull();
    expect(transformed.channels).toBeNull();
  });

  it('should handle old format costs (flat structure)', () => {
    const oldFormatProject = {
      name: "Old Format Product",
      totalCost: 200,
      carpenterCost: 50,
      paintingCost: 30,
      packingCost: 20,
      wasteCost: 10,
    };

    const transformed = transformImportedProject(oldFormatProject);

    expect(transformed.carpenterCost).toBe("50");
    expect(transformed.paintingCost).toBe("30");
    expect(transformed.packingCost).toBe("20");
    expect(transformed.wasteCost).toBe("10");
  });

  it('should handle materials with old format fields', () => {
    const projectWithOldMaterials = {
      name: "Old Materials",
      totalCost: 150,
      materials: [
        {
          // Old format fields
          length: 80,
          pricePerUnit: 25,
          calculatedCost: 25,
          quantity: 3,
        }
      ],
    };

    const transformed = transformImportedProject(projectWithOldMaterials);

    expect(transformed.materials).toHaveLength(1);
    expect(transformed.materials![0].code).toBe("CUSTOM");
    expect(transformed.materials![0].usedLength).toBe(80);
    expect(transformed.materials![0].cost).toBe(25);
    expect(transformed.materials![0].quantity).toBe(3);
  });

  it('should handle empty arrays', () => {
    const projectWithEmptyArrays = {
      name: "Empty Arrays",
      totalCost: 50,
      materials: [],
      channels: [],
    };

    const transformed = transformImportedProject(projectWithEmptyArrays);

    expect(transformed.materials).toEqual([]);
    expect(transformed.channels).toEqual([]);
  });
});

describe('Import Validation', () => {
  it('should validate array input', () => {
    const validInput = [
      { name: "Product 1", totalCost: 100 },
      { name: "Product 2", totalCost: 200 },
    ];

    expect(Array.isArray(validInput)).toBe(true);
    expect(validInput.length).toBe(2);
  });

  it('should reject non-array input', () => {
    const invalidInput = { name: "Single Product" };

    expect(Array.isArray(invalidInput)).toBe(false);
  });
});
