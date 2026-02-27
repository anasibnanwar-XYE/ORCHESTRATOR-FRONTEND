import { apiData, apiRequest, setApiSession } from './api';
import type { AuthSession } from '../types/auth';
import type { CreditLimitOverrideRequestDto } from './client/models/CreditLimitOverrideRequestDto';
import type { CreditLimitOverrideDecisionRequest } from './client/models/CreditLimitOverrideDecisionRequest';
import { CreditLimitOverrideControllerService } from './client/services/CreditLimitOverrideControllerService';
import type { SalesTargetDto } from './client/models/SalesTargetDto';
import type { SalesTargetRequest } from './client/models/SalesTargetRequest';

// --- Re-export Types from Generated Client ---
// We try to match existing interface names where possible or export generated ones.

// Dispatch
// export type { DispatchConfirmRequest } from './client/models/DispatchConfirmRequest'; // Removed due to conflict with local interface
// export type { DispatchConfirmResponse } from './client/models/ApiResponseDispatchConfirmResponse'; // Check actual model name, usually DispatchConfirmResponse or wrapped
// Actually better to define local interfaces matching generated DTOs if names differ widely, 
// OR export generated ones.
// Let's use generated ones where they exist.

// Helper to unwrap "envelope"
const unwrap = <T>(response: any): T => {
  if (response && typeof response === 'object') {
    if ('success' in response && 'data' in response) {
      if (!response.success && response.message) {
        throw new Error(response.message);
      }
      return response.data as T;
    }
  }
  return response as T;
};

// Helper for session
const withSession = (session?: AuthSession | null) => {
  if (session) setApiSession(session);
};

// --- Local Interfaces to maintain backward compatibility ---

export interface DispatchLine {
  lineId?: number;
  batchId?: number;
  shipQty: number;
  priceOverride?: number;
  discount?: number;
  taxRate?: number;
  taxInclusive?: boolean;
}

export interface DispatchConfirmRequest {
  packingSlipId?: number;
  orderId?: number;
  lines?: DispatchLine[];
  adminOverrideCreditLimit?: boolean;
}

export interface CogsPostingDto {
  inventoryAccountId: number;
  cogsAccountId: number;
  cost: number;
}

export interface DispatchConfirmResponse {
  packingSlipId: number;
  salesOrderId: number;
  finalInvoiceId: number | null;
  arJournalEntryId: number | null;
  cogsPostings: CogsPostingDto[];
  dispatched: boolean;
}

export type OrderStatus =
  | 'BOOKED'
  | 'CONFIRMED'
  | 'PENDING_PRODUCTION'
  | 'READY_TO_SHIP'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'CANCELLED'
  | string;

export type GstTreatment = 'NONE' | 'PER_ITEM' | 'ORDER_TOTAL';

export interface SalesOrderItemRequest {
  productCode: string; // Required
  description?: string;
  quantity: number; // Required
  unitPrice: number; // Required
  gstRate?: number;
}

export interface CreateSalesOrderRequest {
  dealerId?: number;
  totalAmount: number; // Required
  currency?: string;
  notes?: string;
  gstTreatment?: GstTreatment;
  gstRate?: number;
  gstInclusive?: boolean; // Optional in backend
  idempotencyKey?: string; // Optional in backend
  items: SalesOrderItemRequest[]; // Required
}

export interface SalesOrderSummary {
  id: number;
  orderNumber?: string;
  dealerId?: number;
  dealerName?: string;
  status: OrderStatus;
  createdAt?: string;
  totalAmount?: number;
}

export type FulfillmentStatus = 'PROCESSING' | 'READY_TO_SHIP' | 'SHIPPED' | 'CANCELLED';

export interface OrderFulfillmentRequest {
  status: FulfillmentStatus;
  notes?: string;
}

export interface OrderApprovalRequest {
  approvedBy: string;
  totalAmount: number;
}

export interface ListOrdersParams {
  status?: OrderStatus | '';
}

// Workflow Trace Functions
export interface TraceEvent {
  id?: string;
  timestamp: string;
  eventType: string;
  status?: string;
  message?: string;
  details?: Record<string, unknown>;
  userId?: string;
  companyCode?: string;
}

export interface WorkflowTrace {
  traceId: string;
  orderId?: number;
  startedAt: string;
  completedAt?: string;
  status: string;
  events: TraceEvent[];
}

// Promotions
export interface PromotionDto {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  discountPercent?: number;
}

export interface PromotionRequest {
  name: string;
  description?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  discountPercent?: number; // 0-100
}

// Credit requests
// Local CreditRequestDto removed to use generated type


export interface CreditRequestPayload {
  dealerId?: number;
  amountRequested: number;
  reason?: string;
}

// Packaging Slip Interfaces
// Slip statuses (updated in cross-module patch to include PARTIAL)
export type SlipStatus =
  | 'PENDING'
  | 'RESERVED'
  | 'PENDING_PRODUCTION'
  | 'PENDING_STOCK'
  | 'PARTIAL'      // Partially shipped but still open
  | 'DISPATCHED'
  | 'CANCELLED'
  | string;

export interface PackagingSlipLineDto {
  id?: number;
  batchPublicId?: string;
  batchCode?: string;
  productCode?: string;
  productName?: string;
  orderedQuantity?: number;
  shippedQuantity?: number;
  backorderQuantity?: number;
  quantity?: number;
  unitCost?: number;
  notes?: string;
}

export interface PackagingSlipDto {
  id: number;
  publicId?: string;
  salesOrderId: number;
  orderNumber?: string;
  dealerName?: string;
  slipNumber?: string;
  status?: SlipStatus;
  createdAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  dispatchedAt?: string;
  dispatchNotes?: string;
  journalEntryId?: number;
  cogsJournalEntryId?: number;
  lines?: PackagingSlipLineDto[];
}


// Import Services
import { SalesControllerService } from './client/services/SalesControllerService';
import { OrchestratorControllerService } from './client/services/OrchestratorControllerService';
import { DispatchControllerService } from './client/services/DispatchControllerService';

// Import Models for type casting if needed
import type { DispatchConfirmRequest as ApiDispatchConfirmRequest } from './client/models/DispatchConfirmRequest';
import type { SalesOrderRequest } from './client/models/SalesOrderRequest';
import type { ApproveOrderRequest } from './client/models/ApproveOrderRequest';
import type { OrderFulfillmentRequest as ApiOrderFulfillmentRequest } from './client/models/OrderFulfillmentRequest';
import type { PromotionRequest as ApiPromotionRequest } from './client/models/PromotionRequest';
import type { CreditRequestRequest } from './client/models/CreditRequestRequest';
import type { CancelRequest } from './client/models/CancelRequest';
import type { StatusRequest } from './client/models/StatusRequest';


// --- API Functions ---

// Sales Order Functions

export async function listSalesOrders(params: ListOrdersParams, session?: AuthSession | null): Promise<SalesOrderSummary[]> {
  withSession(session);
  const statusParam = params.status ? String(params.status) : undefined;
  // SalesControllerService.orders(status)
  const data = unwrap<any[]>(await SalesControllerService.orders(statusParam));

  // Map to SalesOrderSummary
  return data.map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    dealerId: o.dealerId,
    dealerName: o.dealerName,
    status: (o.status?.toUpperCase?.() as OrderStatus) || 'DRAFT',
    createdAt: o.createdAt,
    totalAmount: typeof o.totalAmount === 'number' ? o.totalAmount : Number(o.totalAmount || 0),
  }));
}

export async function createSalesOrder(payload: CreateSalesOrderRequest, session?: AuthSession | null) {
  withSession(session);
  // Cast payload to generated request type if compatible
  return unwrap<{ id: number; orderNumber?: string }>(await SalesControllerService.createOrder(payload as unknown as SalesOrderRequest));
}

export async function approveSalesOrder(orderId: number, payload: OrderApprovalRequest, session?: AuthSession | null) {
  withSession(session);
  const companyCode = session?.companyCode;
  if (!companyCode) throw new Error("Company Code required for orchestrator");

  const idempotencyKey = crypto.randomUUID();
  return apiRequest<{ traceId?: string }>(`/api/v1/orchestrator/orders/${orderId}/approve`, {
    method: 'POST',
    headers: {
      'X-Company-Id': companyCode,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  }, session);
}

export async function confirmSalesOrder(orderId: number, session?: AuthSession | null) {
  withSession(session);
  return unwrap<{ message?: string }>(await SalesControllerService.confirmOrder(orderId));
}

export async function cancelSalesOrder(orderId: number, session?: AuthSession | null) {
  withSession(session);
  // CancelRequest body optional?
  return unwrap<{ message?: string }>(await SalesControllerService.cancelOrder(orderId));
}

export async function updateOrderStatus(orderId: number, status: string, session?: AuthSession | null) {
  withSession(session);
  return unwrap(await SalesControllerService.updateStatus(orderId, { status }));
}

export async function updateOrderFulfillment(orderId: number, payload: OrderFulfillmentRequest, session?: AuthSession | null) {
  withSession(session);
  const companyCode = session?.companyCode;
  if (!companyCode) throw new Error("Company Code required for orchestrator");

  const idempotencyKey = crypto.randomUUID();
  return apiRequest<{ traceId?: string }>(`/api/v1/orchestrator/orders/${orderId}/fulfillment`, {
    method: 'POST',
    headers: {
      'X-Company-Id': companyCode,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  }, session);
}


// Workflow Trace Functions

export async function getWorkflowTrace(
  traceId: string,
  session?: AuthSession | null
): Promise<WorkflowTrace> {
  withSession(session);
  // OrchestratorControllerService.trace(traceId)
  // Response type Record<string, any>? Need to cast to WorkflowTrace
  const res = await OrchestratorControllerService.trace(traceId);
  return unwrap<WorkflowTrace>(res);
}


// Promotions

export const listPromotions = async (session?: AuthSession | null) => {
  withSession(session);
  return unwrap<PromotionDto[]>(await SalesControllerService.promotions());
};

export const createPromotion = async (payload: PromotionRequest, session?: AuthSession | null) => {
  withSession(session);
  return unwrap<PromotionDto>(await SalesControllerService.createPromotion(payload as ApiPromotionRequest));
};

export const updatePromotion = async (id: number, payload: PromotionRequest, session?: AuthSession | null) => {
  withSession(session);
  return unwrap<PromotionDto>(await SalesControllerService.updatePromotion(id, payload as ApiPromotionRequest));
};

export const deletePromotion = async (id: number, session?: AuthSession | null) => {
  withSession(session);
  return await SalesControllerService.deletePromotion(id);
};


// Credit requests

import type { CreditRequestDto } from './client/models/CreditRequestDto';
export type { CreditRequestDto };



// ... (other parts of file are fine, just fixing the Credit section)

// Credit requests

export const listCreditRequests = async (session?: AuthSession | null) => {
  withSession(session);
  // Ensure the response is mapped if the backend returns specific fields differently,
  // but looking at DTO, it seems consistent enough or we rely on generated type.
  return unwrap<CreditRequestDto[]>(await SalesControllerService.creditRequests());
};

export const createCreditRequest = async (payload: CreditRequestPayload, session?: AuthSession | null) => {
  withSession(session);
  const req: CreditRequestRequest = {
    dealerId: payload.dealerId,
    amountRequested: payload.amountRequested,
    reason: payload.reason,
    status: 'PENDING'
  };
  return unwrap<CreditRequestDto>(await SalesControllerService.createCreditRequest(req));
};

// Credit Override Functions
export type { CreditLimitOverrideRequestDto, CreditLimitOverrideDecisionRequest };
export type { CreditLimitOverrideRequestCreateRequest } from './client/models/CreditLimitOverrideRequestCreateRequest';

export const createCreditOverrideRequest = async (
  payload: import('./client/models/CreditLimitOverrideRequestCreateRequest').CreditLimitOverrideRequestCreateRequest,
  session?: AuthSession | null
) => {
  withSession(session);
  return unwrap<CreditLimitOverrideRequestDto>(
    await CreditLimitOverrideControllerService.createRequest(payload)
  );
};

export const listCreditOverrideRequests = async (session?: AuthSession | null) => {
  withSession(session);
  return unwrap<CreditLimitOverrideRequestDto[]>(await CreditLimitOverrideControllerService.listRequests());
};

export const approveCreditOverride = async (
  id: number,
  payload?: CreditLimitOverrideDecisionRequest,
  session?: AuthSession | null
) => {
  withSession(session);
  return unwrap<CreditLimitOverrideRequestDto>(
    await CreditLimitOverrideControllerService.approveRequest(id, payload)
  );
};

export const rejectCreditOverride = async (
  id: number,
  payload?: CreditLimitOverrideDecisionRequest,
  session?: AuthSession | null
) => {
  withSession(session);
  return unwrap<CreditLimitOverrideRequestDto>(
    await CreditLimitOverrideControllerService.rejectRequest(id, payload)
  );
};

// Dispatch Functions

export async function confirmDispatch(
  payload: DispatchConfirmRequest,
  session?: AuthSession | null
) {
  withSession(session);
  // SalesControllerService.confirmDispatch(payload)
  return unwrap<DispatchConfirmResponse>(await SalesControllerService.confirmDispatch(payload as ApiDispatchConfirmRequest));
}

export async function getPackagingSlipByOrder(
  orderId: number,
  session?: AuthSession | null
): Promise<PackagingSlipDto> {
  withSession(session);
  // Manual call to ensure correct endpoint: GET /api/v1/dispatch/order/{orderId}
  return apiData<PackagingSlipDto>(`/api/v1/dispatch/order/${orderId}`, {}, session);
}

export async function getPackagingSlip(
  slipId: number,
  session?: AuthSession | null
): Promise<PackagingSlipDto> {
  withSession(session);
  return unwrap<PackagingSlipDto>(await DispatchControllerService.getPackagingSlip(slipId));
}

export async function getPendingSlips(
  session?: AuthSession | null
): Promise<PackagingSlipDto[]> {
  withSession(session);
  return unwrap<PackagingSlipDto[]>(await DispatchControllerService.getPendingSlips());
}

// Factory Dispatch Types (from DispatchController - simpler than Sales flow)
export interface FactoryLineConfirmation {
  lineId: number;
  shippedQuantity: number;
  notes?: string;
}

export interface FactoryDispatchRequest {
  packagingSlipId: number;
  lines: FactoryLineConfirmation[];
  notes?: string;
  confirmedBy?: string;
}

export interface FactoryDispatchResponse {
  packagingSlipId: number;
  status: string;
  dispatchedLines: number;
  totalShippedQuantity: number;
  notes?: string;
}

/**
 * Confirm dispatch using the Factory/Dispatch controller endpoint.
 * This endpoint is accessible to Factory users without requiring Sales/Accounting roles.
 * Use this instead of confirmDispatch() for Factory portal dispatch operations.
 * 
 * Endpoint: POST /api/v1/dispatch/confirm
 */
// --- Sales Targets ---

export type { SalesTargetDto, SalesTargetRequest };

export async function listSalesTargets(session?: AuthSession | null): Promise<SalesTargetDto[]> {
  withSession(session);
  return unwrap<SalesTargetDto[]>(await SalesControllerService.targets());
}

export async function createSalesTarget(payload: SalesTargetRequest, session?: AuthSession | null): Promise<SalesTargetDto> {
  withSession(session);
  return unwrap<SalesTargetDto>(await SalesControllerService.createTarget(payload));
}

export async function updateSalesTarget(id: number, payload: SalesTargetRequest, session?: AuthSession | null): Promise<SalesTargetDto> {
  withSession(session);
  return unwrap<SalesTargetDto>(await SalesControllerService.updateTarget(id, payload));
}

export async function deleteSalesTarget(id: number, session?: AuthSession | null): Promise<void> {
  withSession(session);
  await SalesControllerService.deleteTarget(id);
}

export async function confirmFactoryDispatch(
  payload: FactoryDispatchRequest,
  session?: AuthSession | null
): Promise<FactoryDispatchResponse> {
  withSession(session);
  // Uses DispatchControllerService.confirmDispatch1() which hits POST /api/v1/dispatch/confirm
  return unwrap<FactoryDispatchResponse>(
    await DispatchControllerService.confirmDispatch1(payload as any)
  );
}

