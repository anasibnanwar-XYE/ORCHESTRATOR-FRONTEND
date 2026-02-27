export interface DashboardInsights {
  highlights: HighlightMetric[];
  pipeline: PipelineStage[];
  hrPulse: HrPulseMetric[];
  enterprise?: EnterpriseDashboardSnapshot;
}

export interface HighlightMetric {
  label: string;
  value: string;
  detail: string;
}

export interface PipelineStage {
  label: string;
  count: number;
}

export interface HrPulseMetric {
  label: string;
  score: string;
  context: string;
}

// Enterprise Dashboard Types
export interface EnterpriseDashboardSnapshot {
  window: EnterpriseWindowMetrics;
  compare: EnterpriseWindowMetrics | null;
  financial: FinancialMetrics;
  sales: SalesMetrics;
  operations: OperationsMetrics;
  ratios: FinancialRatios;
  trends: TrendMetrics;
  alerts: EnterpriseAlert[];
  breakdowns: BreakdownMetrics;
}

export interface EnterpriseWindowMetrics {
  periodStart: string;
  periodEnd: string;
  revenue: number;
  cogs: number;
  grossMargin: number;
  operatingExpense: number;
  operatingMargin: number;
  netProfit: number;
  netMargin: number;
}

export interface FinancialMetrics {
  workingCapital: number;
  currentRatio: number;
  quickRatio: number;
  daysSalesOutstanding: number;
  daysPayableOutstanding: number;
  inventoryTurnoverRatio: number;
}

export interface SalesMetrics {
  totalSales: number;
  salesVsBudgetPercent: number;
  averageOrderValue: number;
  topCategory: string;
  channelMix: ChannelMetric[];
}

export interface ChannelMetric {
  channel: string;
  sales: number;
  sharePercent: number;
}

export interface OperationsMetrics {
  onTimeDeliveryPercent: number;
  productionEfficiencyPercent: number;
  inventoryAccuracyPercent: number;
  qualityDefectRatePercent: number;
  laborUtilizationPercent: number;
}

export interface FinancialRatios {
  grossMarginPercent: number;
  operatingMarginPercent: number;
  netMarginPercent: number;
  returnOnAssetsPercent: number;
  debtToEquity: number;
}

export interface TrendMetrics {
  revenueTrendPercent: number;
  cogsTrendPercent: number;
  grossMarginTrendPercent: number;
  operatingExpenseTrendPercent: number;
  netProfitTrendPercent: number;
}

export interface EnterpriseAlert {
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  category: string;
  message: string;
  value?: number;
  threshold?: number;
}

export interface BreakdownMetrics {
  productCategory: CategoryBreakdown[];
  geographicRegion: RegionBreakdown[];
  customerSegment: SegmentBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  sharePercent: number;
  growthPercent: number;
}

export interface RegionBreakdown {
  region: string;
  revenue: number;
  sharePercent: number;
  growthPercent: number;
}

export interface SegmentBreakdown {
  segment: string;
  revenue: number;
  sharePercent: number;
  growthPercent: number;
}

export interface OperationsInsights {
  summary: OperationsSummary;
  supplyAlerts: SupplyAlert[];
  automationRuns: AutomationRun[];
}

export interface OperationsSummary {
  productionVelocity: number;
  logisticsSla: number;
  workingCapital: string;
}

export interface SupplyAlert {
  material: string;
  status: string;
  detail: string;
}

export interface AutomationRun {
  name: string;
  state: string;
  description: string;
}

export interface WorkforceInsights {
  squads: SquadSummary[];
  moments: UpcomingMoment[];
  leaders: PerformanceLeader[];
}

export interface SquadSummary {
  name: string;
  capacity: string;
  detail: string;
}

export interface UpcomingMoment {
  title: string;
  schedule: string;
  description: string;
}

export interface PerformanceLeader {
  name: string;
  role: string;
  highlight: string;
}
