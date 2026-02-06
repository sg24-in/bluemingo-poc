// Config Entity Models

export interface HoldReason {
  reasonId: number;
  reasonCode: string;
  reasonDescription: string;
  applicableTo?: string;
  status: string;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
}

export interface DelayReason {
  reasonId: number;
  reasonCode: string;
  reasonDescription: string;
  status: string;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
}

export interface ProcessParametersConfig {
  configId: number;
  operationType: string;
  productSku?: string;
  parameterName: string;
  parameterType: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  defaultValue?: number;
  isRequired: boolean;
  displayOrder: number;
  status: string;
  createdOn?: string;
  createdBy?: string;
}

export interface BatchNumberConfig {
  configId: number;
  configName: string;
  operationType?: string;
  productSku?: string;
  prefix: string;
  includeOperationCode: boolean;
  operationCodeLength: number;
  separator: string;
  dateFormat?: string;
  includeDate: boolean;
  sequenceLength: number;
  sequenceReset: string;
  priority: number;
  status: string;
  createdOn?: string;
  createdBy?: string;
}

export interface QuantityTypeConfig {
  configId: number;
  configName: string;
  materialCode?: string;
  operationType?: string;
  equipmentType?: string;
  quantityType: string;
  decimalPrecision: number;
  roundingRule: string;
  minQuantity?: number;
  maxQuantity?: number;
  unit?: string;
  status: string;
  createdOn?: string;
  createdBy?: string;
}
