/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HighlightMetric } from './HighlightMetric';
import type { HrPulseMetric } from './HrPulseMetric';
import type { PipelineStage } from './PipelineStage';
export type DashboardInsights = {
    highlights?: Array<HighlightMetric>;
    pipeline?: Array<PipelineStage>;
    hrPulse?: Array<HrPulseMetric>;
};

