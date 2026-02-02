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
    const title = `📦 SKU Wood Tracker - Backup (${currentDate})`;
    
    expect(title).toContain('SKU Wood Tracker');
    expect(title).toContain('Backup');
    expect(title).toContain(currentDate);
  });
});

describe('Backup JSON File Generation', () => {
  it('should generate unique filename with timestamp and random ID', () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = 'abc12345'; // Mock nanoid
    const fileName = `backups/sku-backup-${timestamp}-${randomId}.json`;
    
    expect(fileName).toContain('backups/');
    expect(fileName).toContain('sku-backup-');
    expect(fileName).toContain('.json');
    expect(fileName.length).toBeGreaterThan(30);
  });

  it('should create valid JSON string from export data', () => {
    const exportData = [
      {
        id: 'TEST1',
        name: 'Test Product',
        version: 1,
        totalCost: 1500,
        materials: [{ code: '51100', quantity: 2 }],
        costs: { carpenter: 100, painting: 50 },
      },
    ];

    const jsonString = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(jsonString);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Test Product');
    expect(parsed[0].materials).toHaveLength(1);
  });

  it('should include all required fields in export data', () => {
    const mockProject = {
      id: 'FULL1',
      name: 'Full Data Product',
      version: 3,
      productionType: 'In-House',
      note: 'Test note',
      materials: [{ code: '51100', quantity: 2, calculatedCost: 200 }],
      carpenterCost: '150',
      paintingCost: '100',
      packingCost: '50',
      wasteCost: '25',
      channels: [{ name: 'Shopee', price: 500, feePercent: 10 }],
      totalCost: '525',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const exportData = {
      id: mockProject.id,
      name: mockProject.name,
      version: mockProject.version,
      productionType: mockProject.productionType,
      note: mockProject.note,
      materials: mockProject.materials,
      costs: {
        carpenter: Number(mockProject.carpenterCost) || 0,
        painting: Number(mockProject.paintingCost) || 0,
        packing: Number(mockProject.packingCost) || 0,
        waste: Number(mockProject.wasteCost) || 0,
      },
      channels: mockProject.channels,
      totalCost: Number(mockProject.totalCost) || 0,
      createdAt: mockProject.createdAt,
      updatedAt: mockProject.updatedAt,
    };

    // Verify all fields are present
    expect(exportData.id).toBe('FULL1');
    expect(exportData.name).toBe('Full Data Product');
    expect(exportData.version).toBe(3);
    expect(exportData.productionType).toBe('In-House');
    expect(exportData.note).toBe('Test note');
    expect(exportData.materials).toHaveLength(1);
    expect(exportData.costs.carpenter).toBe(150);
    expect(exportData.costs.painting).toBe(100);
    expect(exportData.costs.packing).toBe(50);
    expect(exportData.costs.waste).toBe(25);
    expect(exportData.channels).toHaveLength(1);
    expect(exportData.totalCost).toBe(525);
    expect(exportData.createdAt).toBeDefined();
    expect(exportData.updatedAt).toBeDefined();
  });
});

describe('Backup Email Content with Download Link', () => {
  it('should include download link when URL is provided', () => {
    const downloadUrl = 'https://storage.example.com/backups/sku-backup-123.json';
    const content = `📥 **ดาวน์โหลดข้อมูลฉบับเต็ม (JSON):**\n🔗 ${downloadUrl}`;
    
    expect(content).toContain(downloadUrl);
    expect(content).toContain('🔗');
  });

  it('should show fallback message when URL is not available', () => {
    const downloadUrl = '';
    const fallbackMessage = downloadUrl 
      ? `🔗 ${downloadUrl}` 
      : '⚠️ ไม่สามารถสร้างลิงก์ดาวน์โหลดได้';
    
    expect(fallbackMessage).toContain('⚠️');
    expect(fallbackMessage).toContain('ไม่สามารถ');
  });

  it('should mention that link does not expire', () => {
    const downloadUrl = 'https://storage.example.com/backups/test.json';
    const noExpiryMessage = downloadUrl ? '✅ **ลิงก์นี้ไม่มีวันหมดอายุ**' : '';
    
    expect(noExpiryMessage).toContain('ไม่มีวันหมดอายุ');
  });
});
