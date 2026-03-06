 /**
  * Dealer Portal API wrapper
  *
  * All endpoints are scoped to the authenticated dealer (ROLE_DEALER).
  * No dealer ID needed — backend resolves from the auth token.
  *
  * Endpoints:
  *  GET  /api/v1/dealer-portal/dashboard
  *  GET  /api/v1/dealer-portal/orders
  *  GET  /api/v1/dealer-portal/invoices
  *  GET  /api/v1/dealer-portal/invoices/{invoiceId}/pdf
  *  GET  /api/v1/dealer-portal/ledger
  *  GET  /api/v1/dealer-portal/aging
  *  POST /api/v1/dealer-portal/credit-requests
  *  GET  /api/v1/support/tickets        (list dealer's own tickets)
  *  POST /api/v1/support/tickets        (create ticket)
  */
 
 import { apiRequest, apiData } from './api';
 import type {
   ApiResponse,
   CreditRequestDto,
   DealerPortalDashboard,
   DealerPortalOrder,
   DealerPortalInvoice,
   DealerPortalLedgerEntry,
   DealerPortalAging,
   DealerPortalCreditRequestCreate,
   DealerSupportTicket,
   DealerSupportTicketCreateRequest,
 } from '@/types';
 
 export const dealerApi = {
   // ─────────────────────────────────────────────────────────────────────────
   // Dashboard
   // ─────────────────────────────────────────────────────────────────────────
 
   /** Load dealer's own dashboard metrics */
   async getDashboard(): Promise<DealerPortalDashboard> {
     return apiData<DealerPortalDashboard>('/dealer-portal/dashboard');
   },
 
   // ─────────────────────────────────────────────────────────────────────────
   // Orders
   // ─────────────────────────────────────────────────────────────────────────
 
   /** Get dealer's own orders */
   async getOrders(params?: { page?: number; size?: number }): Promise<DealerPortalOrder[]> {
     const q = new URLSearchParams();
     if (params?.page !== undefined) q.set('page', String(params.page));
     if (params?.size !== undefined) q.set('size', String(params.size));
     const qs = q.toString();
     return apiData<DealerPortalOrder[]>(`/dealer-portal/orders${qs ? `?${qs}` : ''}`);
   },
 
   // ─────────────────────────────────────────────────────────────────────────
   // Invoices
   // ─────────────────────────────────────────────────────────────────────────
 
   /** Get dealer's own invoices */
   async getInvoices(params?: { page?: number; size?: number }): Promise<DealerPortalInvoice[]> {
     const q = new URLSearchParams();
     if (params?.page !== undefined) q.set('page', String(params.page));
     if (params?.size !== undefined) q.set('size', String(params.size));
     const qs = q.toString();
     return apiData<DealerPortalInvoice[]>(`/dealer-portal/invoices${qs ? `?${qs}` : ''}`);
   },
 
   /** Download invoice PDF (returns blob) */
   async getInvoicePdf(invoiceId: number): Promise<Blob> {
     const response = await apiRequest.get<Blob>(`/dealer-portal/invoices/${invoiceId}/pdf`, {
       responseType: 'blob',
     });
     return response.data;
   },
 
   // ─────────────────────────────────────────────────────────────────────────
   // Ledger
   // ─────────────────────────────────────────────────────────────────────────
 
   /** Get dealer's transaction ledger */
   async getLedger(): Promise<DealerPortalLedgerEntry[]> {
     return apiData<DealerPortalLedgerEntry[]>('/dealer-portal/ledger');
   },
 
   // ─────────────────────────────────────────────────────────────────────────
   // Aging
   // ─────────────────────────────────────────────────────────────────────────
 
   /** Get dealer's own aging report */
   async getAging(): Promise<DealerPortalAging> {
     return apiData<DealerPortalAging>('/dealer-portal/aging');
   },
 
   // ─────────────────────────────────────────────────────────────────────────
   // Credit Requests
   // ─────────────────────────────────────────────────────────────────────────
 
   /** Submit a credit limit increase request */
   async createCreditRequest(req: DealerPortalCreditRequestCreate): Promise<CreditRequestDto> {
     const response = await apiRequest.post<ApiResponse<CreditRequestDto>>(
       '/dealer-portal/credit-requests',
       req
     );
     return response.data.data;
   },
 
   // ─────────────────────────────────────────────────────────────────────────
   // Support Tickets
   // ─────────────────────────────────────────────────────────────────────────
 
   /** List the dealer's own support tickets */
   async getTickets(): Promise<DealerSupportTicket[]> {
     const response = await apiRequest.get<ApiResponse<{ tickets: DealerSupportTicket[] }>>(
       '/support/tickets'
     );
     return response.data.data.tickets ?? [];
   },
 
   /** Create a new support ticket */
   async createTicket(req: DealerSupportTicketCreateRequest): Promise<DealerSupportTicket> {
     const response = await apiRequest.post<ApiResponse<DealerSupportTicket>>(
       '/support/tickets',
       req
     );
     return response.data.data;
   },
 };
