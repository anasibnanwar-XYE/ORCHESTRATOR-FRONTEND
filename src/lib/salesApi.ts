 /**
  * Sales API wrapper
  *
  * Sales portal operations: orders, dealers, dispatch, credit requests, credit overrides.
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
   DealerDto,
   CreateDealerRequest,
   UpdateDealerRequest,
   DealerAgingDetailedReport,
   LedgerEntryDto,
   DealerInvoiceDto,
   CreditRequestDto,
   CreditRequestCreateRequest,
   CreditRequestUpdateRequest,
   CreditDecisionRequest,
   CreditOverrideRequestDto,
   CreditOverrideCreateRequest,
   CreditOverrideDecisionRequest,
  PromotionDto,
  PromotionRequest,
  SalesTargetDto,
  SalesTargetRequest,
  SalesDispatchConfirmRequest,
  SalesDispatchConfirmResponse,
  DispatchMarkerReconciliationResponse,
  InvoiceDto,
  SalesReturnRequest,
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
  /**
   * Get order by ID.
   *
   * NOTE: The backend does not expose GET /api/v1/sales/orders/{id}.
   * We fetch the full list (up to 500) and find the matching record by id.
   */
  async getOrder(id: number): Promise<SalesOrderDto | null> {
    const orders = await apiData<SalesOrderDto[]>('/sales/orders?size=500');
    return orders.find((o) => o.id === id) ?? null;
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
 
   /** List dealers with pagination */
   async listDealers(params?: { page?: number; size?: number; status?: string }): Promise<PageResponse<DealerDto>> {
     const p = new URLSearchParams();
     if (params?.page !== undefined) p.set('page', String(params.page));
     if (params?.size !== undefined) p.set('size', String(params.size));
     if (params?.status) p.set('status', params.status);
     const q = p.toString();
     return apiData<PageResponse<DealerDto>>(`/dealers${q ? `?${q}` : ''}`);
   },
 
   /** Search dealers by name or code */
   async searchDealersManagement(query: string): Promise<DealerDto[]> {
     const p = new URLSearchParams({ query });
     return apiData<DealerDto[]>(`/dealers/search?${p.toString()}`);
   },
 
   /** Search dealers (active/non-dunning for order creation) */
   async searchDealers(query?: string, status?: string, creditStatus?: string): Promise<DealerLookupResponse[]> {
     const params = new URLSearchParams();
     if (query) params.set('query', query);
     if (status) params.set('status', status);
     if (creditStatus) params.set('creditStatus', creditStatus);
     const q = params.toString();
     return apiData<DealerLookupResponse[]>(`/sales/dealers/search${q ? `?${q}` : ''}`);
   },
 
   /** Create a dealer */
   async createDealer(request: CreateDealerRequest): Promise<DealerDto> {
     const response = await apiRequest.post<ApiResponse<DealerDto>>('/dealers', request);
     return response.data.data;
   },
 
   /** Update a dealer */
   async updateDealer(dealerId: number, request: UpdateDealerRequest): Promise<DealerDto> {
     const response = await apiRequest.put<ApiResponse<DealerDto>>(`/dealers/${dealerId}`, request);
     return response.data.data;
   },
 
   /** Get dealer aging report */
   async getDealerAging(dealerId: number): Promise<DealerAgingDetailedReport> {
     return apiData<DealerAgingDetailedReport>(`/dealers/${dealerId}/aging`);
   },
 
   /** Toggle dunning hold on a dealer */
   async holdDealerDunning(dealerId: number): Promise<DealerDto> {
     const response = await apiRequest.post<ApiResponse<DealerDto>>(`/dealers/${dealerId}/dunning/hold`);
     return response.data.data;
   },
 
   /** Get dealer ledger (chronological transactions) */
   async getDealerLedger(dealerId: number): Promise<LedgerEntryDto[]> {
     return apiData<LedgerEntryDto[]>(`/dealers/${dealerId}/ledger`);
   },
 
   /** Get dealer invoices */
   async getDealerInvoices(dealerId: number): Promise<DealerInvoiceDto[]> {
     return apiData<DealerInvoiceDto[]>(`/dealers/${dealerId}/invoices`);
   },
 
   // ─────────────────────────────────────────────────────────────────────────
   // Credit Requests
   // ─────────────────────────────────────────────────────────────────────────
 
   /** List all credit requests */
   async listCreditRequests(): Promise<CreditRequestDto[]> {
     return apiData<CreditRequestDto[]>('/sales/credit-requests');
   },
 
   /** Create a new credit request */
   async createCreditRequest(request: CreditRequestCreateRequest): Promise<CreditRequestDto> {
     const response = await apiRequest.post<ApiResponse<CreditRequestDto>>('/sales/credit-requests', request);
     return response.data.data;
   },
 
   /** Update an existing credit request */
   async updateCreditRequest(id: number, request: CreditRequestUpdateRequest): Promise<CreditRequestDto> {
     const response = await apiRequest.put<ApiResponse<CreditRequestDto>>(`/sales/credit-requests/${id}`, request);
     return response.data.data;
   },
 
   /** Approve a credit request (updates credit limit on approval) */
   async approveCreditRequest(id: number, req?: CreditDecisionRequest): Promise<CreditRequestDto> {
     const response = await apiRequest.post<ApiResponse<CreditRequestDto>>(
       `/sales/credit-requests/${id}/approve`,
       req ?? {}
     );
     return response.data.data;
   },
 
   /** Reject a credit request */
   async rejectCreditRequest(id: number, req?: CreditDecisionRequest): Promise<CreditRequestDto> {
     const response = await apiRequest.post<ApiResponse<CreditRequestDto>>(
       `/sales/credit-requests/${id}/reject`,
       req ?? {}
     );
     return response.data.data;
   },
 
   // ─────────────────────────────────────────────────────────────────────────
   // Credit Override Requests
   // ─────────────────────────────────────────────────────────────────────────
 
   /** List all credit override requests */
   async listCreditOverrides(): Promise<CreditOverrideRequestDto[]> {
     return apiData<CreditOverrideRequestDto[]>('/credit/override-requests');
   },
 
   /** Create a credit override request */
   async createCreditOverride(request: CreditOverrideCreateRequest): Promise<CreditOverrideRequestDto> {
     const response = await apiRequest.post<ApiResponse<CreditOverrideRequestDto>>('/credit/override-requests', request);
     return response.data.data;
   },
 
   /** Approve a credit override request */
   async approveCreditOverride(id: number, req?: CreditOverrideDecisionRequest): Promise<CreditOverrideRequestDto> {
     const response = await apiRequest.post<ApiResponse<CreditOverrideRequestDto>>(
       `/credit/override-requests/${id}/approve`,
       req ?? {}
     );
     return response.data.data;
   },
 
   /** Reject a credit override request */
   async rejectCreditOverride(id: number, req?: CreditOverrideDecisionRequest): Promise<CreditOverrideRequestDto> {
     const response = await apiRequest.post<ApiResponse<CreditOverrideRequestDto>>(
       `/credit/override-requests/${id}/reject`,
       req ?? {}
     );
     return response.data.data;
   },
 
  // ─────────────────────────────────────────────────────────────────────────
  // Promotions
  // ─────────────────────────────────────────────────────────────────────────

  /** List all promotions */
  async listPromotions(): Promise<PromotionDto[]> {
    return apiData<PromotionDto[]>('/sales/promotions');
  },

  /** Create a promotion */
  async createPromotion(request: PromotionRequest): Promise<PromotionDto> {
    const response = await apiRequest.post<ApiResponse<PromotionDto>>('/sales/promotions', request);
    return response.data.data;
  },

  /** Update a promotion */
  async updatePromotion(id: number, request: PromotionRequest): Promise<PromotionDto> {
    const response = await apiRequest.put<ApiResponse<PromotionDto>>(`/sales/promotions/${id}`, request);
    return response.data.data;
  },

  /** Delete a promotion */
  async deletePromotion(id: number): Promise<void> {
    await apiRequest.delete(`/sales/promotions/${id}`);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Sales Targets
  // ─────────────────────────────────────────────────────────────────────────

  /** List all sales targets */
  async listSalesTargets(): Promise<SalesTargetDto[]> {
    return apiData<SalesTargetDto[]>('/sales/targets');
  },

  /** Create a sales target */
  async createSalesTarget(request: SalesTargetRequest): Promise<SalesTargetDto> {
    const response = await apiRequest.post<ApiResponse<SalesTargetDto>>('/sales/targets', request);
    return response.data.data;
  },

  /** Update a sales target */
  async updateSalesTarget(id: number, request: SalesTargetRequest): Promise<SalesTargetDto> {
    const response = await apiRequest.put<ApiResponse<SalesTargetDto>>(`/sales/targets/${id}`, request);
    return response.data.data;
  },

  /** Delete a sales target */
  async deleteSalesTarget(id: number): Promise<void> {
    await apiRequest.delete(`/sales/targets/${id}`);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Dispatch
  // ─────────────────────────────────────────────────────────────────────────

  /** Confirm dispatch for an order */
  async confirmDispatch(request: SalesDispatchConfirmRequest): Promise<SalesDispatchConfirmResponse> {
    const response = await apiRequest.post<ApiResponse<SalesDispatchConfirmResponse>>(
      '/sales/dispatch/confirm',
      request
    );
    return response.data.data;
  },

  /** Reconcile order markers (packed vs dispatched) */
  async reconcileOrderMarkers(limit?: number): Promise<DispatchMarkerReconciliationResponse> {
    const params = limit !== undefined ? `?limit=${limit}` : '';
    const response = await apiRequest.post<ApiResponse<DispatchMarkerReconciliationResponse>>(
      `/sales/dispatch/reconcile-order-markers${params}`
    );
    return response.data.data;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Invoices
  // ─────────────────────────────────────────────────────────────────────────

  /** List all invoices */
  async listInvoices(params?: { page?: number; size?: number; status?: string }): Promise<InvoiceDto[]> {
    const p = new URLSearchParams();
    if (params?.page !== undefined) p.set('page', String(params.page));
    if (params?.size !== undefined) p.set('size', String(params.size));
    if (params?.status) p.set('status', params.status);
    const q = p.toString();
    return apiData<InvoiceDto[]>(`/invoices${q ? `?${q}` : ''}`);
  },

  /** Get invoice by ID */
  async getInvoice(id: number): Promise<InvoiceDto> {
    return apiData<InvoiceDto>(`/invoices/${id}`);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Sales Returns
  // ─────────────────────────────────────────────────────────────────────────

  /** Process a sales return (POST /api/v1/accounting/sales/returns) — returns the created journal entry */
  async processSalesReturn(request: SalesReturnRequest): Promise<{ id?: number; referenceNumber?: string; entryDate?: string }> {
    const response = await apiRequest.post<ApiResponse<{ id?: number; referenceNumber?: string; entryDate?: string }>>('/accounting/sales/returns', request);
    return response.data?.data ?? {};
  },

   // ─────────────────────────────────────────────────────────────────────────
   // Dashboard
   // ─────────────────────────────────────────────────────────────────────────
 
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