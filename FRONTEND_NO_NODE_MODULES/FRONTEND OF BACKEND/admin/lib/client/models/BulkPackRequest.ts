/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MaterialConsumption } from './MaterialConsumption';
import type { PackLine } from './PackLine';
export type BulkPackRequest = {
    bulkBatchId: number;
    packs: Array<PackLine>;
    packagingMaterials?: Array<MaterialConsumption>;
    packDate?: string;
    packedBy?: string;
    notes?: string;
};

