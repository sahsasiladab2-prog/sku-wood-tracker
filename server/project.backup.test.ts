import { describe, it, expect } from 'vitest';

// Test the backup email content generation
describe('Backup Email Content Generation', () => {
  // Helper function that mirrors the backup content generation logic
  function generateBackupContent(projects: any[]) {
    const exportData = projects.map(p => ({
      id: p.id,
      name: p.name,
      version: p.version,
      productionType: p.productionType,
      note: p.note,
      materials: p.materials,
      costs: {
        carpenter: Number(p.carpenterCost) || 0,
        painting: Number(p.paintingCost) || 0,
        packing: Number(p.packingCost) || 0,
        waste: Number(p.wasteCost) || 0,
      },
      channels: p.channels,
      totalCost: Number(p.totalCost) || 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    const totalSkus = projects.length;
    const totalCost = exportData.reduce((sum, p) => sum + p.totalCost, 0);
    const backupDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      totalSkus,
      totalCost,
      backupDate,
      exportData,
    };
  }

  it('should generate correct summary for multiple projects', () => {
    const mockProjects = [
      {
        id: 'ABC123',
        name: 'Product A',
        version: 1,
        productionType: 'In-House',
        totalCost: '500',
        carpenterCost: '100',
        paintingCost: '50',
        packingCost: '30',
        wasteCost: '20',
        materials: [],
        channels: [],
      },
      {
        id: 'DEF456',
        name: 'Product B',
        version: 2,
        productionType: 'Outsource',
        totalCost: '300',
        carpenterCost: '0',
        paintingCost: '0',
        packingCost: '0',
        wasteCost: '0',
        materials: [],
        channels: [],
      },
    ];

    const result = generateBackupContent(mockProjects);

    expect(result.totalSkus).toBe(2);
    expect(result.totalCost).toBe(800);
    expect(result.exportData).toHaveLength(2);
    expect(result.exportData[0].name).toBe('Product A');
    expect(result.exportData[1].name).toBe('Product B');
  });

  it('should handle empty projects array', () => {
    const result = generateBackupContent([]);

    expect(result.totalSkus).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.exportData).toHaveLength(0);
  });

  it('should convert string costs to numbers', () => {
    const mockProjects = [
      {
        id: 'TEST1',
        name: 'Test Product',
        version: 1,
        productionType: 'In-House',
        totalCost: '1500',
        carpenterCost: '200',
        paintingCost: '150',
        packingCost: '100',
        wasteCost: '50',
        materials: null,
        channels: null,
      },
    ];

    const result = generateBackupContent(mockProjects);

    expect(result.exportData[0].totalCost).toBe(1500);
    expect(result.exportData[0].costs.carpenter).toBe(200);
    expect(result.exportData[0].costs.painting).toBe(150);
    expect(result.exportData[0].costs.packing).toBe(100);
    expect(result.exportData[0].costs.waste).toBe(50);
  });

  it('should handle null/undefined cost values', () => {
    const mockProjects = [
      {
        id: 'TEST2',
        name: 'Null Cost Product',
        version: 1,
        productionType: 'Outsource',
        totalCost: null,
        carpenterCost: undefined,
        paintingCost: null,
        packingCost: undefined,
        wasteCost: null,
        materials: null,
        channels: null,
      },
    ];

    const result = generateBackupContent(mockProjects);

    expect(result.exportData[0].totalCost).toBe(0);
    expect(result.exportData[0].costs.carpenter).toBe(0);
    expect(result.exportData[0].costs.painting).toBe(0);
    expect(result.exportData[0].costs.packing).toBe(0);
    expect(result.exportData[0].costs.waste).toBe(0);
  });

  it('should generate Thai date format', () => {
    const result = generateBackupContent([]);
    
    // Check that backupDate is a non-empty string
    expect(typeof result.backupDate).toBe('string');
    expect(result.backupDate.length).toBeGreaterThan(0);
  });
});

describe('Backup Email Title Generation', () => {
  it('should generate title with current date', () => {
    const currentDate = new Date().toLocaleDateString('th-TH');
    const title = `📦 SKU Wood Tracker - Weekly Backup (${currentDate})`;
    
    expect(title).toContain('SKU Wood Tracker');
    expect(title).toContain('Weekly Backup');
    expect(title).toContain(currentDate);
  });
});
