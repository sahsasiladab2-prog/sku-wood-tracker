import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  bulkCreatePriceHistory: vi.fn().mockResolvedValue(2),
  getPriceHistoryByProjectId: vi.fn().mockResolvedValue([
    {
      id: 1,
      projectId: 'TEST123',
      userId: 1,
      channelName: 'Shopee',
      oldPrice: '1000',
      newPrice: '1200',
      oldFeePercent: '5',
      newFeePercent: '5',
      changedAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      id: 2,
      projectId: 'TEST123',
      userId: 1,
      channelName: 'Lazada',
      oldPrice: '1100',
      newPrice: '1300',
      oldFeePercent: '6',
      newFeePercent: '7',
      changedAt: new Date('2024-01-14T10:00:00Z'),
    },
  ]),
  updateProject: vi.fn().mockResolvedValue({
    id: 'TEST123',
    userId: 1,
    name: 'Test Project',
    version: 1,
    productionType: 'Outsource',
    channels: [
      { name: 'Shopee', price: 1200, feePercent: 5 },
      { name: 'Lazada', price: 1300, feePercent: 7 },
    ],
    carpenterCost: '100',
    paintingCost: '50',
    packingCost: '30',
    wasteCost: '20',
    totalCost: '500',
  }),
}));

import { bulkCreatePriceHistory, getPriceHistoryByProjectId, updateProject } from './db';

describe('Price History Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Price change detection', () => {
    it('should detect price changes between old and new channels', () => {
      const oldChannels = [
        { name: 'Shopee', price: 1000, feePercent: 5 },
        { name: 'Lazada', price: 1100, feePercent: 6 },
      ];
      
      const newChannels = [
        { name: 'Shopee', price: 1200, feePercent: 5 },  // Price changed
        { name: 'Lazada', price: 1300, feePercent: 7 },  // Price and fee changed
      ];

      const historyRecords: Array<{
        channelName: string;
        oldPrice: number;
        newPrice: number;
        oldFeePercent: number;
        newFeePercent: number;
      }> = [];

      for (const newChannel of newChannels) {
        const oldChannel = oldChannels.find(c => c.name === newChannel.name);
        
        if (oldChannel && (oldChannel.price !== newChannel.price || oldChannel.feePercent !== newChannel.feePercent)) {
          historyRecords.push({
            channelName: newChannel.name,
            oldPrice: oldChannel.price,
            newPrice: newChannel.price,
            oldFeePercent: oldChannel.feePercent,
            newFeePercent: newChannel.feePercent,
          });
        }
      }

      expect(historyRecords).toHaveLength(2);
      expect(historyRecords[0]).toEqual({
        channelName: 'Shopee',
        oldPrice: 1000,
        newPrice: 1200,
        oldFeePercent: 5,
        newFeePercent: 5,
      });
      expect(historyRecords[1]).toEqual({
        channelName: 'Lazada',
        oldPrice: 1100,
        newPrice: 1300,
        oldFeePercent: 6,
        newFeePercent: 7,
      });
    });

    it('should not create history when prices are unchanged', () => {
      const oldChannels = [
        { name: 'Shopee', price: 1000, feePercent: 5 },
      ];
      
      const newChannels = [
        { name: 'Shopee', price: 1000, feePercent: 5 },  // No change
      ];

      const historyRecords: Array<any> = [];

      for (const newChannel of newChannels) {
        const oldChannel = oldChannels.find(c => c.name === newChannel.name);
        
        if (oldChannel && (oldChannel.price !== newChannel.price || oldChannel.feePercent !== newChannel.feePercent)) {
          historyRecords.push({
            channelName: newChannel.name,
            oldPrice: oldChannel.price,
            newPrice: newChannel.price,
          });
        }
      }

      expect(historyRecords).toHaveLength(0);
    });
  });

  describe('Database operations', () => {
    it('should call bulkCreatePriceHistory with correct data', async () => {
      const historyRecords = [
        {
          projectId: 'TEST123',
          userId: 1,
          channelName: 'Shopee',
          oldPrice: '1000',
          newPrice: '1200',
          oldFeePercent: '5',
          newFeePercent: '5',
        },
      ];

      const result = await bulkCreatePriceHistory(historyRecords);
      
      expect(bulkCreatePriceHistory).toHaveBeenCalledWith(historyRecords);
      expect(result).toBe(2);
    });

    it('should retrieve price history for a project', async () => {
      const history = await getPriceHistoryByProjectId('TEST123');
      
      expect(getPriceHistoryByProjectId).toHaveBeenCalledWith('TEST123');
      expect(history).toHaveLength(2);
      expect(history[0].channelName).toBe('Shopee');
      expect(history[1].channelName).toBe('Lazada');
    });
  });

  describe('Price history data format', () => {
    it('should convert decimal strings to numbers for display', async () => {
      const history = await getPriceHistoryByProjectId('TEST123');
      
      // Simulate the conversion done in the router
      const formattedHistory = history.map(h => ({
        ...h,
        oldPrice: Number(h.oldPrice) || 0,
        newPrice: Number(h.newPrice) || 0,
        oldFeePercent: Number(h.oldFeePercent) || 0,
        newFeePercent: Number(h.newFeePercent) || 0,
      }));

      expect(formattedHistory[0].oldPrice).toBe(1000);
      expect(formattedHistory[0].newPrice).toBe(1200);
      expect(formattedHistory[1].oldFeePercent).toBe(6);
      expect(formattedHistory[1].newFeePercent).toBe(7);
    });
  });
});
