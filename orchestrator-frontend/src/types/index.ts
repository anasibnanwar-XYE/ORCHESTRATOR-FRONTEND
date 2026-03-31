
// ─────────────────────────────────────────────────────────────────────────────
// Factory Types
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Packing Types
// ─────────────────────────────────────────────────────────────────────────────

/** Unpacked batch from GET /api/v1/factory/unpacked-batches */
export interface UnpackedBatchDto {
  id: number;
  publicId?: string;
  productionCode?: string;
  brandName?: string;
  productName?: string;
  batchColour?: string;
  mixedQuantity?: number;
  packedQuantity?: number;
  remainingQuantity?: number;
  unitOfMeasure?: string;
  status?: ProductionLogStatus;
  producedAt?: string;
  createdAt?: string;
}

/** Single line in a packing record request */
export interface PackingLineRequest {
  packagingSize: string;
  quantityLiters?: number;
  piecesCount?: number;
  boxesCount?: number;
  piecesPerBox?: number;
}

/** Request to record packing POST /api/v1/factory/packing-records */
export interface PackingRequest {
  productionLogId: number;
  packedDate?: string;
  packedBy?: string;
  idempotencyKey?: string;
  lines: PackingLineRequest[];
}

/** Packing record DTO from history */
export interface PackingRecordDto {
  id?: number;
  publicId?: string;
  productionLogId?: number;
  productionCode?: string;
  productName?: string;
  packagingSize?: string;
  quantityPacked?: number;
  packedDate?: string;
  createdAt?: string;
  sizeVariantLabel?: string;
  sizeVariantId?: number;
  packedBy?: string;
  piecesCount?: number;
  boxesCount?: number;
  piecesPerBox?: number;
  childBatchCount?: number;
  finishedGoodBatchId?: number;
  finishedGoodBatchCode?: string;
}

/** Line in a packing record */
export interface BulkPackLine {
  childSkuId: number;
  quantity: number;
  sizeLabel?: string;
  unit?: string;
}

/** Bulk pack material consumption */
export interface BulkPackMaterialConsumption {
  materialId: number;
  quantity: number;
  unit?: string;
}

/** Request for POST /api/v1/factory/pack */
export interface BulkPackRequest {
  bulkBatchId: number;
  packs: BulkPackLine[];
  packagingMaterials?: BulkPackMaterialConsumption[];
  skipPackagingConsumption?: boolean;
  packDate?: string;
  packedBy?: string;
  notes?: string;
  idempotencyKey?: string;
}

/** Child batch DTO from bulk pack response */
export interface ChildBatchDto {
  id?: number;
  publicId?: string;
  batchCode?: string;
  skuId?: number;
  sizeLabel?: string;
  quantity?: number;
  unitCost?: number;
  totalValue?: number;
  createdAt?: string;
}

/** Response from POST /api/v1/factory/pack */
export interface BulkPackResponse {
  consumedBulkQty?: number;
  bulkCost?: number;
  packagingCost?: number;
  journalEntryId?: number;
  packedAt?: string;
  childBatches?: ChildBatchDto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Packaging Size Mapping Types
// ─────────────────────────────────────────────────────────────────────────────

/** Packaging size mapping DTO from GET /api/v1/factory/packaging-mappings */
export interface PackagingSizeMappingDto {
  id: number;
  publicId?: string;
  packagingSize?: string;
  rawMaterialId?: number;
  rawMaterialName?: string;
  unitsPerPack?: number;
  cartonSize?: number;
  litersPerUnit?: number;
  active?: boolean;
  createdAt?: string;
}

/** Request to create/update a packaging size mapping */
export interface PackagingSizeMappingRequest {
  packagingSize: string;
  rawMaterialId?: number;
  unitsPerPack?: number;
  cartonSize?: number;
  litersPerUnit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Task Types
// ─────────────────────────────────────────────────────────────────────────────

/** Factory task priority */
export type FactoryTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Factory task status */
export type FactoryTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

/** Factory task DTO from GET /api/v1/factory/tasks */
export interface FactoryTaskDto {
  id: number;
  publicId?: string;
  title?: string;
  description?: string;
  assignee?: string;
  status?: FactoryTaskStatus;
  dueDate?: string;
  salesOrderId?: number;
  packagingSlipId?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Request to create/update a factory task */
export interface FactoryTaskRequest {
  title: string;
  description?: string;
  assignee?: string;
  status?: FactoryTaskStatus;
  dueDate?: string;
  salesOrderId?: number;
  packagingSlipId?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost Allocation Types
// ─────────────────────────────────────────────────────────────────────────────

/** Cost allocation request POST /api/v1/factory/cost-allocation */
export interface CostAllocationRequest {
  periodStart?: string;
  periodEnd?: string;
  laborCost?: number;
  overheadCost?: number;
  targetAccountIds?: number[];
  notes?: string;
}

/** Cost allocation response */
export interface CostAllocationResponse {
  allocationId?: number;
  totalAllocated?: number;
  affectedJournals?: number[];
  summary?: string;
  allocatedAt?: string;
}

/** Cost breakdown DTO from GET /api/v1/reports/production-logs/{id}/cost-breakdown */
export interface CostBreakdownDto {
  productionLogId?: number;
  productionCode?: string;
  productName?: string;
  costComponents?: {
    productionMaterialCost?: number;
    laborCost?: number;
    overheadCost?: number;
    packagingCost?: number;
    totalCost?: number;
    mixedQuantity?: number;
    packedQuantity?: number;
    blendedUnitCost?: number;
  };
  packedBatches?: Array<{
    packingRecordId?: number;
    finishedGoodBatchId?: number;
    finishedGoodCode?: string;
    finishedGoodName?: string;
    sizeLabel?: string;
    packedQuantity?: number;
    unitCost?: number;
    totalValue?: number;
    accountingReference?: string;
    journalEntryId?: number;
  }>;
  rawMaterialTrace?: Array<{
    movementId?: number;
    materialName?: string;
    quantity?: number;
    unitCost?: number;
    totalCost?: number;
    movementType?: string;
    movedAt?: string;
  }>;
}

/** Factory dashboard DTO from GET /api/v1/factory/dashboard */
export interface FactoryDashboardDto {
  productionEfficiency: number;
  completedPlans: number;
  batchesLogged: number;
  alerts: string[];
}

/** Production plan status lifecycle */
export type ProductionPlanStatus = 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/** Production plan DTO */
export interface ProductionPlanDto {
  id: number;
  publicId?: string;
  planNumber: string;
  productName: string;
  quantity: number;
  plannedDate: string;
  status: ProductionPlanStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Request to create or update a production plan */
export interface ProductionPlanRequest {
  planNumber: string;
  productName: string;
  quantity: number;
  plannedDate: string;
  notes?: string;
}

/** Production plan status update request */
export interface ProductionPlanStatusRequest {
  status: ProductionPlanStatus;
}

/** Production batch DTO (legacy path) */
export interface ProductionBatchDto {
  id: number;
  publicId?: string;
  batchNumber: string;
  quantityProduced: number;
  loggedBy?: string;
  notes?: string;
  createdAt?: string;
  planId?: number;
}


/** Request to create a production batch */
export interface ProductionBatchRequest {
  batchNumber: string;
  quantityProduced: number;
  loggedBy?: string;
  notes?: string;
}

/** Production brand (catalog read-model) */
export interface ProductionBrandDto {
  id: number;
  publicId?: string;
  name: string;
  code: string;
  productCount?: number;
}

/** Production product (catalog read-model) */
export interface ProductionProductDto {
  id: number;
  publicId?: string;
  brandId: number;
  brandName: string;
  brandCode: string;
  productName: string;
  category?: string;
  defaultColour?: string;
  sizeLabel?: string;
  unitOfMeasure?: string;
  skuCode?: string;
  active?: boolean;
}

/** Material usage within a production log */
export interface MaterialUsageRequest {
  rawMaterialId: number;
  quantity: number;
  unitOfMeasure?: string;
}

/** Production log request body */
export interface ProductionLogRequest {
  brandId: number;
  productId: number;
  batchColour?: string;
  batchSize: number;
  unitOfMeasure?: string;
  mixedQuantity: number;
  producedAt?: string;
  notes?: string;
  createdBy?: string;
  addToFinishedGoods?: boolean;
  salesOrderId?: number;
  laborCost?: number;
  overheadCost?: number;
  materials: MaterialUsageRequest[];
}

/** Production log status */
export type ProductionLogStatus =
  | 'READY_TO_PACK'
  | 'PARTIAL_PACKED'
  | 'FULLY_PACKED';

/** Production log list item DTO */
export interface ProductionLogDto {
  id: number;
  publicId?: string;
  productionCode?: string;
  brandId?: number;
  brandName?: string;
  productId?: number;
  productName?: string;
  batchColour?: string;
  batchSize?: number;
  unitOfMeasure?: string;
  mixedQuantity?: number;
  packedQuantity?: number;
  wastageQuantity?: number;
  status?: ProductionLogStatus;
  laborCost?: number;
  overheadCost?: number;
  producedAt?: string;
  createdAt?: string;
}

/** Material usage in production log detail */
export interface ProductionLogMaterialDto {
  id?: number;
  rawMaterialId?: number;
  materialName?: string;
  quantity?: number;
  unitOfMeasure?: string;
  unitCost?: number;
  totalCost?: number;
}

/** Production log packing record */
export interface ProductionLogPackingRecordDto {
  id?: number;
  packingRecordId?: number;
  finishedGoodId?: number;
  finishedGoodBatchId?: number;
  packagingSize?: string;
  quantityLiters?: number;
  piecesCount?: number;
  boxesCount?: number;
  sizeVariantLabel?: string;
  packedAt?: string;
}

/** Full production log detail DTO */
export interface ProductionLogDetailDto extends ProductionLogDto {
  notes?: string;
  materials?: ProductionLogMaterialDto[];
  packingRecords?: ProductionLogPackingRecordDto[];
}

/** Raw material DTO */
export interface RawMaterialDto {
  id: number;
  publicId?: string;
  name: string;
  sku?: string;
  unitType?: string;
  reorderLevel?: number;
  minStock?: number;
  maxStock?: number;
  currentStock?: number;
  status?: string;
}
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Sales Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 /** Order status canonical values */
 export type SalesOrderStatus =
   | 'DRAFT'
   | 'RESERVED'
   | 'PENDING_PRODUCTION'
   | 'PENDING_INVENTORY'
   | 'READY_TO_SHIP'
   | 'PROCESSING'
   | 'CONFIRMED'
   | 'DISPATCHED'
   | 'INVOICED'
   | 'SETTLED'
   | 'CLOSED'
   | 'CANCELLED';
 
 /** Line item within a sales order */
 export interface SalesOrderItemDto {
   id?: number;
   productCode: string;
   description?: string;
   quantity: number;
   unitPrice: number;
   gstRate?: number;
   lineSubtotal?: number;
   lineTax?: number;
   lineTotal?: number;
   cgstAmount?: number;
   sgstAmount?: number;
   igstAmount?: number;
 }
 
 /** Order timeline history entry */
 export interface SalesOrderStatusHistoryDto {
   id: number;
   fromStatus?: string;
   toStatus: string;
   reasonCode?: string;
   reason?: string;
   changedBy: string;
   changedAt: string;
 }
 
 /** Full sales order DTO from API */
 export interface SalesOrderDto {
   id: number;
   publicId?: string;
   orderNumber: string;
   status: SalesOrderStatus;
   totalAmount: number;
   subtotalAmount?: number;
   gstTotal?: number;
   gstRate?: number;
   gstTreatment?: string;
   gstInclusive?: boolean;
   gstRoundingAdjustment?: number;
   currency?: string;
   dealerId?: number;
   dealerName?: string;
   traceId?: string;
   createdAt: string;
   updatedAt?: string;
   items: SalesOrderItemDto[];
   timeline?: SalesOrderStatusHistoryDto[];
 }
 
 /** Request to create or update a sales order */
 export interface SalesOrderRequest {
   dealerId: number;
   totalAmount: number;
   currency?: string;
   gstTreatment?: 'NONE' | 'PER_ITEM' | 'ORDER_TOTAL';
   gstRate?: number;
   gstInclusive?: boolean;
   items: {
     productCode: string;
     description?: string;
     quantity: number;
     unitPrice: number;
     gstRate?: number;
   }[];
 }
 
 /** Cancel order request */
 export interface CancelOrderRequest {
   reasonCode: string;
   reason?: string;
 }
 
 /** Filters for searching orders */
 export interface SalesOrderSearchFilters {
   status?: string;
   dealerId?: number;
   orderNumber?: string;
   fromDate?: string;
   toDate?: string;
   page?: number;
   size?: number;
 }
 
 /** Dealer lookup response from search API */
 export interface DealerLookupResponse {
   id: number;
   name: string;
   code: string;
   contactEmail?: string;
   contactPhone?: string;
   stateCode?: string;
   gstNumber?: string;
   gstRegistrationType?: 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED';
   paymentTerms?: 'NET_30' | 'NET_60' | 'NET_90';
   region?: string;
   creditStatus?: 'WITHIN_LIMIT' | 'NEAR_LIMIT' | 'OVER_LIMIT';
   status?: string;
   creditLimit?: number;
   outstandingAmount?: number;
 }
 
 /** Sales dashboard computed metrics */
 export interface SalesDashboardMetrics {
   totalOrders: number;
   revenue: number;
   outstandingReceivables: number;
   pendingDispatches: number;
   activeOrders: number;
 }

// ─────────────────────────────────────────────────────────────────────────────
// Dealer Management Types
// ─────────────────────────────────────────────────────────────────────────────

/** Full dealer record from /api/v1/dealers */
export interface DealerDto {
  id: number;
  publicId?: string;
  code?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
  outstandingBalance?: number;
  /** Dunning status: NONE | ON_HOLD */
  dunningStatus?: 'NONE' | 'ON_HOLD' | string;
  /** ACTIVE | INACTIVE */
  status?: 'ACTIVE' | 'INACTIVE' | string;
  region?: string;
  gstNumber?: string;
  companyName?: string;
  stateCode?: string;
  gstRegistrationType?: 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED';
  paymentTerms?: 'NET_30' | 'NET_60' | 'NET_90';
  portalEmail?: string;
  generatedPassword?: string;
}

/** Request to create a new dealer */
export interface CreateDealerRequest {
  name: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  gstNumber?: string;
  creditLimit?: number;
  region?: string;
  stateCode?: string;
  gstRegistrationType?: 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED';
  paymentTerms?: 'NET_30' | 'NET_60' | 'NET_90';
}

/** Request to update dealer */
export type UpdateDealerRequest = Partial<CreateDealerRequest>;

/** Aging bucket summary for a dealer */
export interface AgingBucketDto {
  label?: string;
  fromDays?: number;
  toDays?: number;
  amount?: number;
}

/** Aging buckets (structured format) */
export interface AgingBuckets {
  current?: number;
  days1to30?: number;
  days31to60?: number;
  days61to90?: number;
  over90?: number;
}

/** Aging line item */
export interface AgingLineItem {
  invoiceId?: number;
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  amount?: number;
  outstanding?: number;
  daysOverdue?: number;
  bucket?: string;
}

/** Detailed aging report for a dealer */
export interface DealerAgingDetailedReport {
  dealerId?: number;
  dealerCode?: string;
  dealerName?: string;
  lineItems?: AgingLineItem[];
  buckets?: AgingBuckets;
  totalOutstanding?: number;
  averageDSO?: number;
}

/** Ledger entry */
export interface LedgerEntryDto {
  dealerName?: string;
  date?: string;
  reference?: string;
  debit?: number;
  credit?: number;
  balance?: number;
}

/** Invoice DTO for dealer invoices list */
export interface DealerInvoiceDto {
  id?: number;
  publicId?: string;
  invoiceNumber?: string;
  status?: string;
  subtotal?: number;
  taxTotal?: number;
  totalAmount?: number;
  outstandingAmount?: number;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  dealerId?: number;
  dealerName?: string;
  salesOrderId?: number;
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Credit Request Types
// ─────────────────────────────────────────────────────────────────────────────

/** Credit request DTO */
export interface CreditRequestDto {
  id?: number;
  publicId?: string;
  dealerId?: number;
  dealerName?: string;
  amountRequested?: number;
  status?: string;
  reason?: string;
  createdAt?: string;
}

/** Request to create a credit request */
export interface CreditRequestCreateRequest {
  dealerId: number;
  amountRequested: number;
  reason?: string;
}

/** Request to update a credit request */
export interface CreditRequestUpdateRequest {
  dealerId?: number;
  amountRequested?: number;
  reason?: string;
  status?: string;
}

/** Decision request for credit request approve/reject */
export interface CreditDecisionRequest {
  reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Credit Override Types
// ─────────────────────────────────────────────────────────────────────────────

/** Credit limit override request DTO */
export interface CreditOverrideRequestDto {
  id?: number;
  publicId?: string;
  dealerId?: number;
  dealerName?: string;
  packagingSlipId?: number;
  salesOrderId?: number;
  dispatchAmount?: number;
  currentExposure?: number;
  creditLimit?: number;
  requiredHeadroom?: number;
  status?: string;
  reason?: string;
  requestedBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  expiresAt?: string;
  createdAt?: string;
}

/** Request to create a credit override request */
export interface CreditOverrideCreateRequest {
  dealerId?: number;
  packagingSlipId?: number;
  salesOrderId?: number;
  dispatchAmount: number;
  reason?: string;
  expiresAt?: string;
}

/** Decision request for credit override approve/reject */
export interface CreditOverrideDecisionRequest {
  reason?: string;
  expiresAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Promotions Types
// ─────────────────────────────────────────────────────────────────────────────

/** Promotion DTO from GET /api/v1/sales/promotions */
export interface PromotionDto {
  id?: number;
  publicId?: string;
  name?: string;
  description?: string;
  discountType?: 'PERCENTAGE' | 'FLAT' | string;
  discountValue?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  imageUrl?: string;
}

/** Request to create or update a promotion */
export interface PromotionRequest {
  name: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  startDate: string;
  endDate: string;
  description?: string;
  status?: string;
  imageUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sales Targets Types
// ─────────────────────────────────────────────────────────────────────────────

/** Sales Target DTO from GET /api/v1/sales/targets */
export interface SalesTargetDto {
  id?: number;
  publicId?: string;
  name?: string;
  assignee?: string;
  periodStart?: string;
  periodEnd?: string;
  targetAmount?: number;
  achievedAmount?: number;
}

/** Request to create or update a sales target */
export interface SalesTargetRequest {
  name: string;
  assignee: string;
  periodStart: string;
  periodEnd: string;
  targetAmount: number;
  achievedAmount?: number;
  changeReason: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dispatch Types
// ─────────────────────────────────────────────────────────────────────────────

/** Single line in a dispatch confirm request */
export interface DispatchConfirmLine {
  lineId?: number;
  shipQty: number;
  batchId?: number;
  priceOverride?: number;
  discount?: number;
  taxRate?: number;
  taxInclusive?: boolean;
  notes?: string;
}

/** Request to confirm dispatch via POST /api/v1/sales/dispatch/confirm */
export interface SalesDispatchConfirmRequest {
  orderId: number;
  packingSlipId?: number;
  confirmedBy?: string;
  dispatchNotes?: string;
  lines: DispatchConfirmLine[];
  adminOverrideCreditLimit?: boolean;
  overrideRequestId?: number;
  overrideReason?: string;
}

/** Response from dispatch confirm */
export interface SalesDispatchConfirmResponse {
  salesOrderId?: number;
  packingSlipId?: number;
  dispatched?: boolean;
  finalInvoiceId?: number;
  gstBreakdown?: {
    cgst?: number;
    sgst?: number;
    igst?: number;
    taxableAmount?: number;
    totalTax?: number;
  };
}

/** Reconcile order markers response */
export interface DispatchMarkerReconciliationResponse {
  scannedOrders?: number;
  reconciledOrders?: number;
  reconciledOrderIds?: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoice Types (full sales invoice, distinct from DealerInvoiceDto)
// ─────────────────────────────────────────────────────────────────────────────

/** Invoice line DTO */
export interface InvoiceLineDto {
  id?: number;
  description?: string;
  productCode?: string;
  quantity?: number;
  unitPrice?: number;
  taxableAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  discountAmount?: number;
  lineTotal?: number;
}

/** Full invoice DTO from GET /api/v1/invoices */
export interface InvoiceDto {
  id?: number;
  publicId?: string;
  invoiceNumber?: string;
  status?: string;
  salesOrderId?: number;
  dealerId?: number;
  dealerName?: string;
  issueDate?: string;
  dueDate?: string;
  subtotal?: number;
  taxTotal?: number;
  totalAmount?: number;
  outstandingAmount?: number;
  currency?: string;
  journalEntryId?: number;
  createdAt?: string;
  lines?: InvoiceLineDto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sales Returns Types
// ─────────────────────────────────────────────────────────────────────────────

/** Single return line item */
export interface SalesReturnLine {
  invoiceLineId: number;
  quantity: number;
}

/** Request to process a sales return POST /api/v1/accounting/sales/returns */
export interface SalesReturnRequest {
  invoiceId: number;
  reason: string;
  lines: SalesReturnLine[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator Dashboard Types
// ─────────────────────────────────────────────────────────────────────────────

export interface OrchestratorAdminDashboard {
  /** GET /api/v1/orchestrator/dashboard/admin — raw (no ApiResponse wrapper) */
  dealers: {
    active: number;
    total: number;
    creditUtilization: number;
  };
  orders: {
    total: number;
    pending: number;
    approved: number;
  };
  accounting: {
    accounts: number;
    ledgerBalance: number;
  };
}

export interface OrchestratorFactoryDashboard {
  /** GET /api/v1/orchestrator/dashboard/factory — raw (no ApiResponse wrapper) */
  production: {
    efficiency: number;
    completed: number;
    batchesLogged: number;
  };
  inventory: {
    value: number;
    lowStock: number;
  };
  tasks: number;
}

export interface OrchestratorFinanceDashboard {
  /** GET /api/v1/orchestrator/dashboard/finance — raw (no ApiResponse wrapper) */
  ledger: {
    accounts: number;
    ledgerBalance: number;
  };
  cashflow: {
    investing: number;
    net: number;
    financing: number;
    operating: number;
  };
  agedDebtors: Array<{ label?: string; debtorName?: string; amount?: number; count?: number }>;
  reconciliation: {
    physicalInventoryValue: number;
    ledgerInventoryBalance: number;
    variance: number;
  };
}

export interface OrchestratorDispatchRequest {
  orderId: number;
  notes?: string;
  lineItems?: { productId: number; quantity: number }[];
}

export interface OrchestratorFulfillmentRequest {
  lineItems: { productId: number; quantity: number; status: 'SHIPPED' | 'DELIVERED' }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Portal Insights Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PortalDashboard {
  /**
   * GET /api/v1/portal/dashboard — DashboardInsights DTO
   * Wrapped in ApiResponse (uses response.data.data).
   */
  highlights: Array<{ label: string; value: string; detail: string }>;
  pipeline: Array<{ label: string; count: number }>;
  hrPulse: Array<{ label: string; score: string; context: string }>;
}

export interface PortalOperations {
  /**
   * GET /api/v1/portal/operations — OperationsInsights DTO
   * Wrapped in ApiResponse (uses response.data.data).
   */
  summary: {
    productionVelocity: number;
    logisticsSla: number;
    workingCapital: string;
  };
  supplyAlerts: Array<{ material: string; status: string; detail: string }>;
  automationRuns: Array<{ name: string; state: string; description: string }>;
}

export interface PortalWorkforce {
  /**
   * GET /api/v1/portal/workforce — WorkforceInsights DTO
   * Wrapped in ApiResponse (uses response.data.data).
   * NOTE: May return 403/500 if HR_PAYROLL module is disabled for the tenant.
   */
  squads: Array<{ name: string; capacity: string; detail: string }>;
  moments: Array<{ title: string; schedule: string; description: string }>;
  leaders: Array<{ name: string; role: string; highlight: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Trail Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BusinessEvent {
  /**
   * GET /api/v1/admin/audit/events — BusinessAuditEventResponse DTO
   * Wrapped in ApiResponse<PageResponse<BusinessAuditEventResponse>>.
   */
  id: string | number;
  occurredAt: string;
  source?: string;
  module?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  referenceNumber?: string;
  status?: string;
  failureReason?: string;
  amount?: number;
  currency?: string;
  correlationId?: string;
  requestId?: string;
  traceId?: string;
  actorUserId?: number;
  actorIdentifier?: string;
  metadata?: Record<string, string>;
}

/** Role-assignment request for assigning a platform role to a superadmin user */
export interface RoleAssignmentRequest {
  userId: number;
  roleKey: string;
}

export interface MlEvent {
  /**
   * GET /api/v1/audit/ml-events — MlInteractionEventResponse DTO
   * Wrapped in ApiResponse<PageResponse<MlInteractionEventResponse>>.
   */
  id: string | number;
  occurredAt: string;
  module?: string;
  action: string;
  interactionType?: string;
  screen?: string;
  targetId?: string;
  status?: string;
  failureReason?: string;
  correlationId?: string;
  requestId?: string;
  traceId?: string;
  actorUserId?: number;
  actorIdentifier?: string;
  actorAnonymized?: boolean;
  consentOptIn?: boolean;
  trainingSubjectKey?: string;
  payload?: string;
  metadata?: Record<string, string>;
}

export interface AuditEventFilters {
  actor?: string;
  action?: string;
  module?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

/**
 * GET /api/v1/accounting/audit/events — AccountingAuditTrailEntryDto
 * Wrapped in ApiResponse<PageResponse<AccountingAuditTrailEntryDto>>.
 */
export interface AccountingAuditTrailEntry {
  id: number;
  timestamp: string;
  companyId?: number;
  companyCode?: string;
  actorUserId?: number;
  actorIdentifier?: string;
  actionType: string;
  entityType?: string;
  entityId?: string;
  referenceNumber?: string;
  traceId?: string;
  ipAddress?: string;
  beforeState?: string;
  afterState?: string;
  sensitiveOperation?: boolean;
  metadata?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Runtime Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantRuntimeMetrics {
  // TenantRuntimeMetricsDto from GET /api/v1/admin/tenant-runtime/metrics
  companyCode?: string;
  // Backend rate-limit fields
  totalUsers: number;
  enabledUsers: number;
  maxActiveUsers: number;
  requestsThisMinute: number;
  maxRequestsPerMinute: number;
  inFlightRequests: number;
  maxConcurrentRequests: number;
  blockedThisMinute: number;
  holdState?: string;
  holdReason?: string;
  policyReference?: string;
  policyUpdatedAt?: string;
  // Legacy / enriched usage fields also returned by the runtime endpoint
  apiCalls: number;
  apiCallsLimit: number;
  storageUsedMb: number;
  storageLimit: number;
  activeSessions: number;
  period?: string;
  /** IP addresses allowed to bypass rate-limiting (allowlist) */
  ipAllowlist?: string[];
  /** Remaining requests allowed before rate-limit is hit */
  rateLimitHeadroom?: number;
}

export interface TenantRuntimePolicyUpdateRequest {
  maxActiveUsers?: number;
  maxConcurrentRequests?: number;
  maxRequestsPerMinute?: number;
  holdState?: string;
  holdReason?: string;
  changeReason?: string;
}

export interface TenantPolicy {
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  maxLoginAttempts: number;
  mfaRequired?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Operations Control Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FeatureFlag {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface OperationsStatus {
  maintenanceMode: boolean;
  featureFlags: FeatureFlag[];
  cacheLastPurged?: string | null;
}
// ─────────────────────────────────────────────────────────────────────────────
// Core API Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  /** Required: tenant scope for the login request. */
  companyCode: string;
  /** TOTP code (6 digits) when responding to an MFA challenge via re-login. */
  mfaCode?: string;
  /** Recovery code alternative to mfaCode when responding to an MFA challenge via re-login. */
  recoveryCode?: string;
}

/**
 * Flat DTO returned by POST /auth/login, POST /auth/mfa/verify,
 * POST /auth/switch-company. There is NO nested `user` object in this response.
 * After receiving this DTO, the app calls GET /auth/me to hydrate the full User.
 */
export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  /** Company code scoped to this token */
  companyCode: string;
  /** Formatted display name (e.g. "Jane Smith") */
  displayName: string;
  mustChangePassword?: boolean;
  requiresMfa?: boolean;
  tempToken?: string;
}

/**
 * Normalized auth result returned by authApi.login(), verifyMfa(), switchCompany().
 * Combines the flat backend DTO with the hydrated User object from GET /auth/me.
 */
export type AuthResult = LoginResponse & { user: User };

/** @deprecated Use LoginRequest with mfaCode/recoveryCode instead */
export interface MfaVerifyRequest {
  code: string;
  tempToken: string;
}

/**
 * Response from POST /auth/mfa/setup.
 * The qrUri is an otpauth:// URI suitable for QR code rendering.
 * recoveryCodes are one-time use backup codes; shown once at setup.
 */
export interface MfaSetupResponse {
  secret: string;
  qrUri: string;
  recoveryCodes: string[];
}

/**
 * Request body for POST /auth/mfa/disable.
 * At least one of code or recoveryCode must be present.
 */
export interface MfaDisableRequest {
  code?: string;
  recoveryCode?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  /**
   * Required: company code used to mint a tenant-scoped access token.
   * Must be passed on every refresh call including during company switching.
   */
  companyCode: string;
}

export interface ForgotPasswordRequest {
  email: string;
  companyCode: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SwitchCompanyRequest {
  companyCode: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * User shape matching backend MeResponse (GET /auth/me).
 * Note: no id, firstName, lastName, role (singular), isActive, companyCode, createdAt, updatedAt.
 */
export interface User {
  email: string;
  displayName: string;
  companyId?: string;
  mfaEnabled: boolean;
  mustChangePassword?: boolean;
  /** Array of role strings, e.g. ["ROLE_ADMIN"] */
  roles: string[];
  permissions: string[];
  /**
   * List of enabled module keys for the user's company.
   * An empty array (or missing) means all modules are enabled.
   * When non-empty, only the listed modules are enabled.
   */
  enabledModules?: string[];
}

/**
 * Profile shape matching backend ProfileResponse (GET /auth/profile).
 */
export interface Profile {
  email: string;
  displayName: string;
  preferredName?: string;
  jobTitle?: string;
  profilePictureUrl?: string;
  phoneSecondary?: string;
  secondaryEmail?: string;
  mfaEnabled: boolean;
  companies: string[];
  createdAt: string;
  publicId: string;
}

/**
 * Request body for PUT /auth/profile.
 */
export interface UpdateProfileRequest {
  displayName?: string;
  preferredName?: string;
  jobTitle?: string;
  profilePictureUrl?: string;
  phoneSecondary?: string;
  secondaryEmail?: string;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  roles: string[];
  password?: string;
  companyId: number;
}

export interface UpdateUserRequest {
  displayName: string;
  roles: string[];
  companyId: number;
  enabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Role Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Role {
  key: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleRequest {
  key: string;
  name: string;
  description?: string;
  permissions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Approval Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApprovalItem {
  /** Backend field: originType (AdminApprovalItemDto.originType) */
  originType: 'CREDIT_REQUEST' | 'CREDIT_LIMIT_OVERRIDE_REQUEST' | 'PAYROLL_RUN' | 'PERIOD_CLOSE_REQUEST' | 'EXPORT_REQUEST' | string;
  ownerType?: string;
  id: number;
  publicId?: string;
  reference: string;
  status: string;
  summary: string;
  reportType?: string;
  parameters?: string;
  requesterUserId?: number;
  requesterEmail?: string;
  actionType?: string;
  actionLabel?: string;
  approveEndpoint?: string;
  rejectEndpoint?: string;
  createdAt: string;
}

export interface ApprovalsResponse {
  // AdminApprovalsResponse from GET /api/v1/admin/approvals
  // grouped by type — UI normalises into flat items
  creditRequests: ApprovalItem[];
  payrollRuns: ApprovalItem[];
  exportRequests: ApprovalItem[];
  periodCloseRequests: ApprovalItem[];
}

export interface CreditRequestDecisionRequest {
  reason: string;
}

export interface PeriodCloseActionRequest {
  note?: string;
  force?: boolean;
}
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Export Approval Types
 // ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Admin Notification Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminNotifyRequest {
  /** Email address of the recipient */
  to: string;
  subject: string;
  body: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Changelog Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChangelogEntryRequest {
  title: string;
  body: string;
  version: string;
  isHighlighted?: boolean;
}

export interface ChangelogEntryResponse {
  id: number;
  title: string;
  body: string;
  version: string;
  isHighlighted?: boolean;
  publishedAt: string;
  createdBy?: string;
}

 // ─────────────────────────────────────────────────────────────────────────────
 // Export Approval Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 export type ExportApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
 
 export interface ExportRequestDto {
   requestId: string;
   requester: string;
   reportType: string;
   requestedAt: string;
   status: ExportApprovalStatus;
   parameters?: string;
   message?: string;
 }
 
 export interface ExportRequestDecisionRequest {
   reason?: string;
 }

// ─────────────────────────────────────────────────────────────────────────────
// Company Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Company {
  id: number;
  code: string;
  name: string;
  timezone?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * System settings returned by GET /api/v1/admin/settings.
 * Matches the backend SystemSettingsDto exactly.
 */
export interface SystemSettings {
  allowedOrigins?: string[];
  autoApprovalEnabled?: boolean;
  periodLockEnforced?: boolean;
  exportApprovalRequired?: boolean;
  platformAuthCode?: string;
  mailEnabled?: boolean;
  mailFromAddress?: string;
  mailBaseUrl?: string;
  sendCredentials?: boolean;
  sendPasswordReset?: boolean;
}

/**
 * @deprecated Use SystemSettings instead. Kept for backward compatibility during migration.
 */
export type AdminSettings = SystemSettings;

/**
 * @deprecated Use SystemSettings instead. Kept for backward compatibility during migration.
 */
export type ExtendedAdminSettings = SystemSettings;

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  totalCompanies: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Session (persisted to localStorage)
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  companyCode: string;
  companyId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string> | string[];
  timestamp?: string;
}
 
 // ─────────────────────────────────────────────────────────────────────────────
 // Superadmin / Tenant Types
 // ─────────────────────────────────────────────────────────────────────────────
 
 /**
  * Tenant (company) record as seen by superadmin.
  * Extends Company with lifecycle status and usage metrics.
  */
 export interface Tenant {
   id: number;
   code: string;
   name: string;
   address?: string;
   phone?: string;
   email?: string;
   gstNumber?: string;
   /** isActive drives whether the tenant is enabled */
   isActive: boolean;
   /** Explicit lifecycle status (ACTIVE | SUSPENDED | DEACTIVATED | NEW) */
   status?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'NEW';
   /** Storage consumed by this tenant in megabytes */
   storageUsedMb?: number;
   timezone?: string;
   defaultGstRate?: number;
   createdAt: string;
   updatedAt: string;
 }
 
 /** Request body for onboarding a new tenant (atomically creates company + admin user) */
 export interface TenantOnboardRequest {
   // Step 1 — Company details
   name: string;
   code: string;
   address?: string;
   phone?: string;
   email?: string;
   gstNumber?: string;
   timezone?: string;
   defaultGstRate?: number;
   // Step 2 — Initial admin user
   adminEmail: string;
   adminDisplayName: string;
   adminPassword: string;
 }
 /**
  * SuperAdminTenantDto — tenant record as returned by /api/v1/superadmin/tenants.
  * This is NOT the same as CompanyDto/Tenant. It exposes usage metrics and status.
  */
 export interface SuperAdminTenantDto {
   companyId: number;
   companyCode: string;
   companyName: string;
   status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
   activeUsers: number;
   apiCallCount: number;
   storageBytes: number;
   lastActivityAt: string | null;
 }

 /** Dashboard metrics from GET /api/v1/superadmin/dashboard */
 export interface SuperAdminDashboardDto {
   totalTenants: number;
   activeTenants: number;
   suspendedTenants: number;
   deactivatedTenants: number;
   totalUsers: number;
   totalApiCalls: number;
   totalStorageBytes: number;
   recentActivityAt: string | null;
 }

 /** Usage metrics for a single tenant from GET /api/v1/superadmin/tenants/{id}/usage */
 export interface SuperAdminTenantUsageDto {
   companyId: number;
   companyCode: string;
   status: string;
   apiCallCount: number;
   activeUsers: number;
   storageBytes: number;
   lastActivityAt: string | null;
 }

 /** CoA template from GET /api/v1/superadmin/tenants/coa-templates */
 export interface CoATemplateDto {
   code: string;
   name: string;
   description?: string;
   accountCount?: number;
 }

 /**
  * Onboarding request for POST /api/v1/superadmin/tenants/onboard.
  * Requires coaTemplateCode in addition to company and admin user details.
  */
 export interface TenantOnboardingRequest {
   companyName: string;
   companyCode: string;
   adminEmail: string;
   adminDisplayName: string;
   adminTemporaryPassword: string;
   coaTemplateCode: string;
   timezone?: string;
   defaultGstRate?: number;
   address?: string;
   phone?: string;
   gstNumber?: string;
 }

 /** Response from POST /api/v1/superadmin/tenants/onboard (includes one-time admin password) */
 export interface TenantOnboardingResponse {
   companyId: number;
   companyCode: string;
   companyName: string;
   status: string;
   adminTemporaryPassword: string;
 }

 /**
  * Request body for updating enabled modules on a tenant.
  * PUT /api/v1/superadmin/tenants/{id}/modules
  *
  * Gatable modules: MANUFACTURING, HR_PAYROLL, PURCHASING, PORTAL, REPORTS_ADVANCED
  * Core modules (always enabled, not listed here): AUTH, ACCOUNTING, SALES, INVENTORY
  */
 export interface TenantModulesUpdateRequest {
   enabledModules: string[];
 }

 /** Response from PUT /api/v1/superadmin/tenants/{id}/modules */
 export interface CompanyEnabledModulesDto {
   companyId: number;
   companyCode: string;
   enabledModules: string[];
 }

 /** Request body for updating tenant details */
 /** Request body for updating tenant details */
 export interface TenantUpdateRequest {
   name?: string;
   address?: string;
   phone?: string;
   email?: string;
   gstNumber?: string;
   timezone?: string;
   defaultGstRate?: number;
 }
 
 /** Request body for sending a support warning to a tenant */
 export interface SupportWarningRequest {
   severity: 'INFO' | 'WARNING' | 'CRITICAL';
   message: string;
 }
 
 /** Request body for resetting a tenant admin's password */
 export interface AdminPasswordResetRequest {
   adminEmail: string;
   newPassword?: string;
 }
 
 /** Platform-level dashboard metrics */
 export interface PlatformDashboardMetrics {
   totalTenants: number;
   activeTenants: number;
   suspendedTenants: number;
   totalPlatformUsers: number;
   storageConsumption: number;
 }
 
/** Support ticket (cross-tenant) */
export interface SupportTicket {
  id: string;
  tenantName?: string;
  tenantCode?: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt?: string;
  description?: string;
  responses?: Array<{ author: string; message: string; createdAt: string }>;
}

/**
 * SupportTicketResponse — ticket record matching backend SupportTicketResponse DTO.
 * Used by /api/v1/support/tickets (list) and /api/v1/support/tickets/{ticketId} (detail).
 */
export interface SupportTicketResponse {
  id: number;
  publicId: string;
  companyCode: string;
  userId: number;
  requesterEmail: string | null;
  category: 'BUG' | 'FEATURE_REQUEST' | 'SUPPORT';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  githubIssueNumber: number | null;
  githubIssueUrl: string | null;
  githubIssueState: string | null;
  githubSyncedAt: string | null;
  githubLastError: string | null;
  resolvedAt: string | null;
  resolvedNotificationSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Legacy priority field — may be absent from backend response */
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/** Response from GET /api/v1/support/tickets */
export interface SupportTicketListResponse {
  tickets: SupportTicketResponse[];
}

/** Ticket priority levels */
export type TicketPriority = SupportTicket['priority'];

/** Ticket response/message in a conversation thread */
export interface TicketResponse {
  id: string;
  author: string;
  authorRole?: 'SUPPORT_AGENT' | 'SUPERADMIN' | 'TENANT_USER';
  message: string;
  isInternal?: boolean;
  createdAt: string;
}

/** Ticket attachment */
export interface TicketAttachment {
  id: string;
  filename: string;
  url: string;
  contentType?: string;
  sizeBytes?: number;
  uploadedAt: string;
  uploadedBy: string;
}

/** Ticket status history entry */
export interface TicketStatusHistory {
  id: string;
  fromStatus?: string;
  toStatus: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

/** Full ticket detail (extended SupportTicket for detail view) */
export interface SupportTicketDetail extends SupportTicket {
  description: string;
  assignedAgent?: string;
  responses: TicketResponse[];
  attachments: TicketAttachment[];
  statusHistory: TicketStatusHistory[];
}

/** Request body for adding a response to a ticket */
export interface TicketResponseRequest {
  message: string;
  isInternal?: boolean;
}

/** Request body for updating ticket priority */
export interface TicketPriorityRequest {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/** Request body for assigning an agent to a ticket */
export interface TicketAssignRequest {
  agentEmail: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory Dispatch Types
// ─────────────────────────────────────────────────────────────────────────────

/** Status of a packaging slip */
export type PackagingSlipStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'BACKORDER';

/** A line item within a packaging slip */
export interface PackagingSlipLineDto {
  id?: number;
  productCode?: string;
  productName?: string;
  quantity?: number;
  orderedQuantity?: number;
  shippedQuantity?: number;
  backorderQuantity?: number;
  batchCode?: string;
  batchPublicId?: string;
  unitCost?: number;
  notes?: string;
}

/** A packaging slip (dispatch slip) */
export interface PackagingSlipDto {
  id: number;
  publicId?: string;
  slipNumber?: string;
  orderNumber?: string;
  salesOrderId?: number;
  dealerName?: string;
  status?: PackagingSlipStatus;
  dispatchNotes?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  dispatchedAt?: string;
  createdAt?: string;
  journalEntryId?: number;
  cogsJournalEntryId?: number;
  lines?: PackagingSlipLineDto[];
}

/** Line preview in dispatch preview */
export interface DispatchLinePreview {
  lineId?: number;
  productCode?: string;
  productName?: string;
  finishedGoodId?: number;
  orderedQuantity?: number;
  availableQuantity?: number;
  suggestedShipQuantity?: number;
  batchCode?: string;
  hasShortage?: boolean;
  unitPrice?: number;
  lineSubtotal?: number;
  lineTax?: number;
  lineTotal?: number;
}

/** GST breakdown in preview */
export interface GstBreakdown {
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalTax?: number;
  grandTotal?: number;
}

/** Dispatch preview DTO */
export interface DispatchPreviewDto {
  packagingSlipId?: number;
  slipNumber?: string;
  salesOrderId?: number;
  salesOrderNumber?: string;
  dealerCode?: string;
  dealerName?: string;
  status?: string;
  lines?: DispatchLinePreview[];
  gstBreakdown?: GstBreakdown;
  totalOrderedAmount?: number;
  totalAvailableAmount?: number;
  createdAt?: string;
}

/** Line confirmation request */
export interface LineConfirmation {
  lineId: number;
  shippedQuantity: number;
  notes?: string;
}

/** Dispatch confirmation request (Factory portal) */
export interface FactoryDispatchConfirmRequest {
  packagingSlipId: number;
  confirmedBy?: string;
  notes?: string;
  overrideRequestId?: number;
  lines: LineConfirmation[];
}

/** Dispatch confirmation response (Factory portal) */
export interface FactoryDispatchConfirmationResponse {
  packagingSlipId?: number;
  slipNumber?: string;
  status?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  totalOrderedAmount?: number;
  totalShippedAmount?: number;
  totalBackorderAmount?: number;
  backorderSlipId?: number;
  journalEntryId?: number;
  cogsJournalEntryId?: number;
  lines?: Array<{
    lineId?: number;
    productCode?: string;
    productName?: string;
    orderedQuantity?: number;
    shippedQuantity?: number;
    backorderQuantity?: number;
    unitCost?: number;
    lineTotal?: number;
    notes?: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Finished Goods (Factory) Types
// ─────────────────────────────────────────────────────────────────────────────

/** Finished good DTO (from /api/v1/finished-goods) */
export interface FactoryFinishedGoodDto {
  id: number;
  publicId?: string;
  name: string;
  productCode?: string;
  unit?: string;
  currentStock?: number;
  reservedStock?: number;
  costingMethod?: string;
  cogsAccountId?: number;
  revenueAccountId?: number;
  valuationAccountId?: number;
  discountAccountId?: number;
  taxAccountId?: number;
}

/** Request to create/update a finished good */
export interface FactoryFinishedGoodRequest {
  name: string;
  productCode: string;
  unit?: string;
  costingMethod?: string;
  cogsAccountId?: number;
  revenueAccountId?: number;
  valuationAccountId?: number;
  discountAccountId?: number;
  taxAccountId?: number;
}

/** Finished good batch DTO */
export interface FactoryFinishedGoodBatchDto {
  id: number;
  publicId?: string;
  batchCode?: string;
  quantityTotal?: number;
  quantityAvailable?: number;
  unitCost?: number;
  manufacturedAt?: string;
  expiryDate?: string;
}

/** Request to register a finished good batch */
export interface FactoryFinishedGoodBatchRequest {
  finishedGoodId: number;
  quantity: number;
  unitCost: number;
  batchCode?: string;
  manufacturedAt?: string;
  expiryDate?: string;
}

/** Stock summary DTO */
export interface FactoryStockSummaryDto {
  id?: number;
  publicId?: string;
  name?: string;
  code?: string;
  currentStock?: number;
  reservedStock?: number;
  availableStock?: number;
  weightedAverageCost?: number;
  totalBatches?: number;
  totalMaterials?: number;
  lowStockMaterials?: number;
  criticalStockMaterials?: number;
}

/** Low stock threshold DTO */
export interface FinishedGoodLowStockThresholdDto {
  finishedGoodId?: number;
  productCode?: string;
  threshold?: number;
}

/** Child batch DTO (for batch hierarchy) */
export interface ChildBatchDto {
  id?: number;
  publicId?: string;
  batchCode?: string;
  sizeLabel?: string;
  quantity?: number;
  unitCost?: number;
  totalValue?: number;
  finishedGoodId?: number;
  finishedGoodName?: string;
  finishedGoodCode?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw Materials (Factory view) Types
// ─────────────────────────────────────────────────────────────────────────────

/** Raw material batch DTO */
export interface FactoryRawMaterialBatchDto {
  id?: number;
  publicId?: string;
  batchCode?: string;
  supplierId?: number;
  supplierName?: string;
  quantity?: number;
  unit?: string;
  costPerUnit?: number;
  receivedAt?: string;
  notes?: string;
}

/** Inventory stock snapshot */
export interface InventoryStockSnapshot {
  sku?: string;
  name?: string;
  currentStock?: number;
  reorderLevel?: number;
  status?: string;
}

/** Raw material intake request */
export interface RawMaterialIntakeRequest {
  rawMaterialId: number;
  supplierId: number;
  quantity: number;
  unit: string;
  costPerUnit: number;
  batchCode?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  notes?: string;
}

 // ─────────────────────────────────────────────────────────────────────────────
 // Dealer Portal Types
 // ─────────────────────────────────────────────────────────────────────────────

 /** Dealer portal dashboard summary */
 export interface DealerPortalDashboard {
   dealerId?: number;
   dealerName?: string;
   dealerCode?: string;
   currentBalance?: number;
   creditLimit?: number;
   availableCredit?: number;
   totalOutstanding?: number;
   pendingInvoices?: number;
   pendingOrderCount?: number;
   pendingOrderExposure?: number;
   creditUsed?: number;
   creditStatus?: string;
   /** Aging buckets keyed by string labels e.g. "current", "1-30 days", "31-60 days", "61-90 days", "90+ days" */
   agingBuckets?: Record<string, number>;
 }

 /** Dealer portal order (read-only) */
 export interface DealerPortalOrder {
   id?: number;
   orderNumber?: string;
   createdAt?: string;
   status?: string;
   totalAmount?: number;
   paymentStatus?: string;
 }

 /** Dealer portal invoice */
 export interface DealerPortalInvoice {
   id?: number;
   invoiceNumber?: string;
   issueDate?: string;
   subtotal?: number;
   taxTotal?: number;
   totalAmount?: number;
   status?: string;
   outstandingAmount?: number;
   dueDate?: string;
 }

 /** Dealer portal ledger entry */
 export interface DealerPortalLedgerEntry {
   date?: string;
   reference?: string;
   description?: string;
   type?: string;
   debit?: number;
   credit?: number;
   balance?: number;
 }

 /** Dealer portal aging report */
 /** Overdue invoice from dealer portal aging response */
 export interface DealerPortalOverdueInvoice {
   invoiceNumber?: string;
   issueDate?: string;
   dueDate?: string;
   daysOverdue?: number;
   outstandingAmount?: number;
 }

 export interface DealerPortalAging {
   dealerId?: number;
   dealerName?: string;
   creditLimit?: number;
   totalOutstanding?: number;
   pendingOrderCount?: number;
   pendingOrderExposure?: number;
   creditUsed?: number;
   availableCredit?: number;
   /** Aging buckets keyed by string labels e.g. "current", "1-30 days", "31-60 days", "61-90 days", "90+ days" */
   agingBuckets?: Record<string, number>;
   overdueInvoices?: DealerPortalOverdueInvoice[];
 }

 /** Request to create a credit request from the dealer portal */
 export interface DealerPortalCreditRequestCreate {
   amountRequested: number;
   reason?: string;
 }

 /** Support ticket from dealer portal */
 export interface DealerSupportTicket {
   id?: number;
   publicId?: string;
   subject?: string;
   category?: string;
   description?: string;
   status?: string;
   requesterEmail?: string;
   createdAt?: string;
   updatedAt?: string;
 }

 /** Request to create a support ticket */
 export interface DealerSupportTicketCreateRequest {
   subject: string;
   category: string;
   description: string;
 }
