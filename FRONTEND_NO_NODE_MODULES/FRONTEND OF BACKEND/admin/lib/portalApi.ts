import { apiData } from './api';
import type { AuthSuccess } from '../types/auth';
import type { DashboardInsights, OperationsInsights, WorkforceInsights } from '../types/portal';

export interface GetDashboardInsightsParams {
  window?: string;
  compare?: string;
  timezone?: string;
}

/**
 * Fetches the executive dashboard insights.
 * GET /api/v1/portal/dashboard
 */
export async function getDashboardInsights(session: AuthSuccess | null, params?: GetDashboardInsightsParams): Promise<DashboardInsights> {
  const query = new URLSearchParams();
  if (params?.window) query.set('window', params.window);
  if (params?.compare) query.set('compare', params.compare);
  if (params?.timezone) query.set('timezone', params.timezone);
  
  const queryString = query.toString();
  const path = `/api/v1/portal/dashboard${queryString ? `?${queryString}` : ''}`;
  
  return apiData<DashboardInsights>(path, {}, session);
}

/**
 * Fetches the operations insights.
 * GET /api/v1/portal/operations
 */
export async function getOperationsInsights(session: AuthSuccess | null): Promise<OperationsInsights> {
    return apiData<OperationsInsights>('/api/v1/portal/operations', {}, session);
}

/**
 * Fetches the workforce insights.
 * GET /api/v1/portal/workforce
 */
export async function getWorkforceInsights(session: AuthSuccess | null): Promise<WorkforceInsights> {
    return apiData<WorkforceInsights>('/api/v1/portal/workforce', {}, session);
}
