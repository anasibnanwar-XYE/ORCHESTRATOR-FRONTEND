 /**
  * Tests for accountingApi types and exports
  *
  * Verifies:
  *  - AccountType union includes all 8 backend types (including COGS, OTHER_INCOME, OTHER_EXPENSE)
  *  - ACCOUNT_TYPE_LABELS has entries for all 8 types
  *  - AgedReceivablesReport uses grandTotal (not totalOutstanding)
  *  - AgingBuckets and DealerAgingDetail types are exported
  */
 
 import { describe, it, expect } from 'vitest';
 import {
   ACCOUNT_TYPE_LABELS,
   type AccountType,
   type AgedReceivablesReport,
   type AgingBuckets,
   type DealerAgingDetail,
 } from '@/lib/accountingApi';
 
 describe('AccountType', () => {
   it('ACCOUNT_TYPE_LABELS has entries for all 8 account types', () => {
     const expectedTypes: AccountType[] = [
       'ASSET',
       'LIABILITY',
       'EQUITY',
       'REVENUE',
       'EXPENSE',
       'COGS',
       'OTHER_INCOME',
       'OTHER_EXPENSE',
     ];
     expectedTypes.forEach((type) => {
       expect(ACCOUNT_TYPE_LABELS[type]).toBeDefined();
       expect(typeof ACCOUNT_TYPE_LABELS[type]).toBe('string');
       expect(ACCOUNT_TYPE_LABELS[type].length).toBeGreaterThan(0);
     });
   });
 
   it('ACCOUNT_TYPE_LABELS has correct labels', () => {
     expect(ACCOUNT_TYPE_LABELS['ASSET']).toBe('Assets');
     expect(ACCOUNT_TYPE_LABELS['LIABILITY']).toBe('Liabilities');
     expect(ACCOUNT_TYPE_LABELS['EQUITY']).toBe('Equity');
     expect(ACCOUNT_TYPE_LABELS['REVENUE']).toBe('Revenue');
     expect(ACCOUNT_TYPE_LABELS['EXPENSE']).toBe('Expenses');
     expect(ACCOUNT_TYPE_LABELS['COGS']).toBe('Cost of Goods Sold');
     expect(ACCOUNT_TYPE_LABELS['OTHER_INCOME']).toBe('Other Income');
     expect(ACCOUNT_TYPE_LABELS['OTHER_EXPENSE']).toBe('Other Expense');
   });
 });
 
 describe('AgedReceivablesReport', () => {
   it('AgedReceivablesReport uses grandTotal field', () => {
     // Verify the type shape at runtime with a conforming object
     const report: AgedReceivablesReport = {
       asOfDate: '2024-03-01',
       dealers: [],
       totalBuckets: {
         current: 100,
         days1to30: 50,
         days31to60: 25,
         days61to90: 10,
         over90: 5,
       },
       grandTotal: 190,
     };
     expect(report.grandTotal).toBe(190);
     expect(report.dealers).toEqual([]);
   });
 
   it('AgingBuckets has all 5 bucket fields', () => {
     const buckets: AgingBuckets = {
       current: 1000,
       days1to30: 500,
       days31to60: 250,
       days61to90: 100,
       over90: 50,
     };
     expect(buckets.current).toBe(1000);
     expect(buckets.days1to30).toBe(500);
     expect(buckets.days31to60).toBe(250);
     expect(buckets.days61to90).toBe(100);
     expect(buckets.over90).toBe(50);
   });
 
   it('DealerAgingDetail has dealerId, dealerCode, dealerName, buckets, totalOutstanding', () => {
     const detail: DealerAgingDetail = {
       dealerId: 1,
       dealerCode: 'D001',
       dealerName: 'Acme Dealers',
       buckets: {
         current: 5000,
         days1to30: 2000,
         days31to60: 500,
         days61to90: 0,
         over90: 0,
       },
       totalOutstanding: 7500,
     };
     expect(detail.dealerId).toBe(1);
     expect(detail.totalOutstanding).toBe(7500);
   });
 });
