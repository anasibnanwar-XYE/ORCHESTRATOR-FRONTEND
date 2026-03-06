/**
 * Unit tests for dealerApi.ts
 *
 * Verifies that nested backend response shapes are parsed correctly:
 * - GET /dealer-portal/orders returns { success, data: { orders: [...] } }
 * - GET /dealer-portal/invoices returns { success, data: { invoices: [...] } }
 * - GET /dealer-portal/ledger returns { success, data: { entries: [...] } }
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module before importing dealerApi
vi.mock('@/lib/api', () => ({
  apiRequest: {
    get: vi.fn(),
    post: vi.fn(),
  },
  apiData: vi.fn(),
}));

import { dealerApi } from '@/lib/dealerApi';
import { apiRequest, apiData } from '@/lib/api';

describe('dealerApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrders', () => {
    it('extracts orders array from nested backend response { data: { orders: [...] } }', async () => {
      const mockOrders = [
        { id: 1, orderNumber: 'SO-001', status: 'CONFIRMED', totalAmount: 50000 },
        { id: 2, orderNumber: 'SO-002', status: 'INVOICED', totalAmount: 35000 },
      ];
      (apiRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          message: 'OK',
          data: { orders: mockOrders },
          timestamp: '2026-01-01T00:00:00Z',
        },
      });

      const result = await dealerApi.getOrders();
      expect(result).toEqual(mockOrders);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('returns empty array when orders key is missing from response', async () => {
      (apiRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: {},
          timestamp: '2026-01-01T00:00:00Z',
        },
      });

      const result = await dealerApi.getOrders();
      expect(result).toEqual([]);
    });

    it('passes page and size query params', async () => {
      (apiRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: { orders: [] } },
      });

      await dealerApi.getOrders({ page: 2, size: 20 });
      const calledUrl = (apiRequest.get as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('size=20');
    });
  });

  describe('getInvoices', () => {
    it('extracts invoices array from nested backend response { data: { invoices: [...] } }', async () => {
      const mockInvoices = [
        { id: 101, invoiceNumber: 'INV-001', totalAmount: 53100, status: 'UNPAID' },
      ];
      (apiRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: { invoices: mockInvoices },
        },
      });

      const result = await dealerApi.getInvoices();
      expect(result).toEqual(mockInvoices);
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns empty array when invoices key is missing from response', async () => {
      (apiRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: {},
        },
      });

      const result = await dealerApi.getInvoices();
      expect(result).toEqual([]);
    });
  });

  describe('getLedger', () => {
    it('extracts entries array from nested backend response { data: { entries: [...] } }', async () => {
      const mockEntries = [
        { date: '2026-01-05', reference: 'INV-001', type: 'INVOICE', debit: 53100, credit: 0, balance: 53100 },
        { date: '2026-01-15', reference: 'PAY-001', type: 'PAYMENT', debit: 0, credit: 30000, balance: 23100 },
      ];
      (apiRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: { entries: mockEntries },
        },
      });

      const result = await dealerApi.getLedger();
      expect(result).toEqual(mockEntries);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('returns empty array when entries key is missing from response', async () => {
      (apiRequest.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          success: true,
          data: {},
        },
      });

      const result = await dealerApi.getLedger();
      expect(result).toEqual([]);
    });
  });

  describe('getDashboard', () => {
    it('delegates to apiData for the dashboard endpoint', async () => {
      const mockDashboard = { outstandingBalance: 100000 };
      (apiData as ReturnType<typeof vi.fn>).mockResolvedValue(mockDashboard);

      const result = await dealerApi.getDashboard();
      expect(result).toEqual(mockDashboard);
      expect(apiData).toHaveBeenCalledWith('/dealer-portal/dashboard');
    });
  });

  describe('getAging', () => {
    it('delegates to apiData for the aging endpoint', async () => {
      const mockAging = { buckets: { current: 50000 } };
      (apiData as ReturnType<typeof vi.fn>).mockResolvedValue(mockAging);

      const result = await dealerApi.getAging();
      expect(result).toEqual(mockAging);
      expect(apiData).toHaveBeenCalledWith('/dealer-portal/aging');
    });
  });
});
