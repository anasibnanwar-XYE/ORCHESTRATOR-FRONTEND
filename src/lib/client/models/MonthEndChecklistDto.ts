/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountingPeriodDto } from './AccountingPeriodDto';
import type { MonthEndChecklistItemDto } from './MonthEndChecklistItemDto';
export type MonthEndChecklistDto = {
    period?: AccountingPeriodDto;
    items?: Array<MonthEndChecklistItemDto>;
    readyToClose?: boolean;
};

