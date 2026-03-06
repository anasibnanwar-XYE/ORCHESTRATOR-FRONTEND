 /**
  * Sales API wrapper
  *
  * Sales portal operations: orders, dealers, dispatch, credit requests.
  */
 
 import { apiRequest, apiData } from './api';
 import type {
   ApiResponse,
   PageResponse,
   SalesOrderDto,
   SalesOrderRequest,
   SalesOrderSearchFilters,
   SalesOrderStatusHistoryDto,
   CancelOrderRequest,
   DealerLookupResponse,
   SalesDashboardMetrics,
 } from '@/types';
 
 export const salesApi = {
   // ─────────────────────────────────────────────────────────────────────────
   // Orders
   // ─────────────────────────────────────────────────────────────────────────
 
   /** List orders with optional filters */
   async getOrders(filters?: { status?: string; dealerId?: number; page?: number; size?: number }): Promise<SalesOrderDto[]> {
     const params = new URLSearchParams();
     if (filters?.status) params.set('status', filters.status);
     if (filters?.dealerId !== undefined) params.set('dealerId', String(filters.dealerId));
     if (filters?.page !== undefined) params.set('page', String(filters.page));
     if (filters?.size !== undefined) params.set('size', String(filters.size));
     const query = params.toString();
     return apiData<SalesOrderDto[]>(`/sales/orders${query ? `?${query}` : ''}`);
   },
 
   /** Search orders with advanced filters */
   async searchOrders(filters: SalesOrderSearchFilters): Promise<PageResponse<SalesOrderDto>> {
     const params = new URLSearchParams();
     if (filters.status) params.set('status', filters.status);
     if (filters.dealerId !== undefined) params.set('dealerId', String(filters.dealerId));
     if (filters.orderNumber) params.set('orderNumber', filters.orderNumber);
     if (filters.fromDate) params.set('fromDate', filters.fromDate);
     if (filters.toDate) params.set('toDate', filters.toDate);
     params.set('page', String(filters.page ?? 0));
     params.set('size', String(filters.size ?? 20));
     const query = params.toString();
     return apiData<PageResponse<SalesOrderDto>>(`/sales/orders/search${query ? `?${query}` : ''}`);
   },
 
   /** Get order by ID */
   async getOrder(id: number): Promise<SalesOrderDto> {
     return apiData<SalesOrderDto>(`/sales/orders/${id}`);
   },
 
   /** Create a new sales order */
   async createOrder(request: SalesOrderRequest): Promise<SalesOrderDto> {
     const response = await apiRequest.post<ApiResponse<SalesOrderDto>>('/sales/orders', request);
     return response.data.data;
   },
 
   /** Update an existing draft order */
   async updateOrder(id: number, request: SalesOrderRequest): Promise<SalesOrderDto> {
     const response = await apiRequest.put<ApiResponse<SalesOrderDto>>(`/sales/orders/${id}`, request);
     return response.data.data;
   },
 
   /** Delete a draft order */
   async deleteOrder(id: number): Promise<void> {
     await apiRequest.delete(`/sales/orders/${id}`);
   },
 
   /** Confirm an order (Draft → Confirmed) */
   async confirmOrder(id: number): Promise<SalesOrderDto> {
     const response = await apiRequest.post<ApiResponse<SalesOrderDto>>(`/sales/orders/${id}/confirm`);
     return response.data.data;
   },
 
   /** Cancel an order with reason */
   async cancelOrder(id: number, request: CancelOrderRequest): Promise<SalesOrderDto> {
     const response = await apiRequest.post<ApiResponse<SalesOrderDto>>(`/sales/orders/${id}/cancel`, request);
     return response.data.data;
   },
 
   /** Update order status manually */
   async updateOrderStatus(id: number, status: string): Promise<SalesOrderDto> {
     const response = await apiRequest.patch<ApiResponse<SalesOrderDto>>(`/sales/orders/${id}/status`, { status });
     return response.data.data;
   },
 
   /** Get order timeline */
   async getOrderTimeline(id: number): Promise<SalesOrderStatusHistoryDto[]> {
     return apiData<SalesOrderStatusHistoryDto[]>(`/sales/orders/${id}/timeline`);
   },
 
   // ─────────────────────────────────────────────────────────────────────────
   // Dealers
   // ─────────────────────────────────────────────────────────────────────────
 
   /** Search dealers (active/non-dunning for order creation) */
   async searchDealers(query?: string, status?: string, creditStatus?: string): Promise<DealerLookupResponse[]> {
     const params = new URLSearchParams();
     if (query) params.set('query', query);
     if (status) params.set('status', status);
     if (creditStatus) params.set('creditStatus', creditStatus);
     const q = params.toString();
     return apiData<DealerLookupResponse[]>(`/sales/dealers/search${q ? `?${q}` : ''}`);
   },
 
   /** Get dashboard metrics — derived from orders/dealers */
   async getDashboardMetrics(): Promise<SalesDashboardMetrics> {
     // We'll get the orders and compute metrics client-side
     const [ordersResult] = await Promise.allSettled([
       salesApi.searchOrders({ page: 0, size: 200 }),
     ]);
 
     const orders: SalesOrderDto[] = ordersResult.status === 'fulfilled'
       ? ordersResult.value.content ?? []
       : [];
 
     const activeStatuses = ['DRAFT', 'RESERVED', 'CONFIRMED', 'PENDING_PRODUCTION', 'PENDING_INVENTORY', 'READY_TO_SHIP', 'PROCESSING'];
     const pendingDispatch = ['CONFIRMED', 'RESERVED', 'PENDING_PRODUCTION', 'READY_TO_SHIP', 'PROCESSING'];
 
     const totalOrders = orders.length;
     const revenue = orders
       .filter((o) => !['CANCELLED', 'DRAFT'].includes(o.status))
       .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
     const outstandingReceivables = orders
       .filter((o) => ['INVOICED', 'DISPATCHED'].includes(o.status))
       .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
     const pendingDispatches = orders.filter((o) => pendingDispatch.includes(o.status)).length;
     const activeOrders = orders.filter((o) => activeStatuses.includes(o.status)).length;
 
     return {
       totalOrders,
       revenue,
       outstandingReceivables,
       pendingDispatches,
       activeOrders,
     };
   },
 };
