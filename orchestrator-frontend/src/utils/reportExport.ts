 /**
  * reportExport — client-side CSV generation and PDF print for reports.
  *
  * Since the backend returns JSON with export-readiness metadata (pdfReady/csvReady)
  * rather than binary blobs, we generate downloads client-side from the data we have.
  *
  * CSV: Build from an array of rows + headers, download via downloadBlob.
  * PDF: Use the browser's native print dialog (window.print()).
  */
 
 import { downloadBlob } from './mobileUtils';
 
 /** CSV cell escaping per RFC 4180 */
 function escapeCsvCell(value: string | number | null | undefined): string {
   if (value == null) return '';
   const str = String(value);
   if (str.includes(',') || str.includes('"') || str.includes('\n')) {
     return `"${str.replace(/"/g, '""')}"`;
   }
   return str;
 }
 
 /** Build a CSV string from headers + rows */
 function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
   const lines = [
     headers.map(escapeCsvCell).join(','),
     ...rows.map((row) => row.map(escapeCsvCell).join(',')),
   ];
   return lines.join('\r\n');
 }
 
 /** Download a CSV string as a file */
 export function downloadCsv(csvContent: string, filename: string): void {
   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
   downloadBlob(blob, filename);
 }
 
 /** Open browser print dialog for PDF export */
 export function printToPdf(): void {
   window.print();
 }
 
 // ─── Report-specific CSV exporters ──────────────────────────────────────────
 
 export interface TrialBalanceRow {
   code: string;
   name: string;
   type: string;
   debit: number;
   credit: number;
   net: number;
 }
 
 export function exportTrialBalanceCsv(rows: TrialBalanceRow[], filename = 'trial-balance.csv'): void {
   const csv = buildCsv(
     ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit', 'Net'],
     rows.map((r) => [r.code, r.name, r.type, r.debit, r.credit, r.net])
   );
   downloadCsv(csv, filename);
 }
 
 export interface ProfitLossExportData {
   revenue: number;
   costOfGoodsSold: number;
   grossProfit: number;
   operatingExpenses: number;
   netIncome: number;
   categories?: Array<{ category: string; amount: number }>;
 }
 
 export function exportProfitLossCsv(data: ProfitLossExportData, filename = 'profit-loss.csv'): void {
   const rows: (string | number)[][] = [
     ['Revenue', data.revenue],
     ['Cost of Goods Sold', data.costOfGoodsSold],
     ['Gross Profit', data.grossProfit],
   ];
   if (data.categories?.length) {
     rows.push(['--- Operating Expenses by Category ---', '']);
     data.categories.forEach((c) => rows.push([c.category, c.amount]));
   }
   rows.push(['Total Operating Expenses', data.operatingExpenses]);
   rows.push(['Net Income', data.netIncome]);
   const csv = buildCsv(['Item', 'Amount (INR)'], rows);
   downloadCsv(csv, filename);
 }
 
 export interface BalanceSheetExportData {
   totalAssets: number;
   totalLiabilities: number;
   totalEquity: number;
 }
 
 export function exportBalanceSheetCsv(data: BalanceSheetExportData, filename = 'balance-sheet.csv'): void {
   const csv = buildCsv(
     ['Item', 'Amount (INR)'],
     [
       ['Total Assets', data.totalAssets],
       ['Total Liabilities', data.totalLiabilities],
       ['Total Equity', data.totalEquity],
       ['Assets = Liabilities + Equity', data.totalAssets === data.totalLiabilities + data.totalEquity ? 'Balanced' : 'Imbalanced'],
     ]
   );
   downloadCsv(csv, filename);
 }
