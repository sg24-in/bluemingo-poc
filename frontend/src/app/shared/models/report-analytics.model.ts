export interface ProductionSummary {
  startDate: string;
  endDate: string;
  totalProduced: number;
  totalScrap: number;
  yieldPercentage: number;
  avgCycleTimeMinutes: number;
  confirmationCount: number;
}

export interface ProductionByOperation {
  startDate: string;
  endDate: string;
  entries: OperationProductionEntry[];
}

export interface OperationProductionEntry {
  operationType: string;
  confirmationCount: number;
  totalProduced: number;
  totalScrap: number;
  yieldPercentage: number;
}

export interface ScrapAnalysis {
  startDate: string;
  endDate: string;
  totalScrap: number;
  scrapByProduct: ScrapByProductEntry[];
  scrapByOperation: ScrapByOperationEntry[];
}

export interface ScrapByProductEntry {
  productSku: string;
  scrapQuantity: number;
  percentage: number;
}

export interface ScrapByOperationEntry {
  operationType: string;
  scrapQuantity: number;
  percentage: number;
}

export interface OrderFulfillment {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  overdueOrders: number;
  completionPercentage: number;
}

export interface InventoryBalance {
  totalItems: number;
  totalQuantity: number;
  byType: InventoryByTypeEntry[];
  byState: InventoryByStateEntry[];
}

export interface InventoryByTypeEntry {
  inventoryType: string;
  itemCount: number;
  totalQuantity: number;
}

export interface InventoryByStateEntry {
  state: string;
  itemCount: number;
  totalQuantity: number;
}

export interface OperationCycleTimes {
  startDate: string;
  endDate: string;
  entries: CycleTimeEntry[];
}

export interface CycleTimeEntry {
  operationType: string;
  avgMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  sampleCount: number;
}

export interface HoldAnalysis {
  totalActiveHolds: number;
  totalReleasedHolds: number;
  byEntityType: HoldByEntityTypeEntry[];
  topReasons: HoldReasonEntry[];
}

export interface HoldByEntityTypeEntry {
  entityType: string;
  activeCount: number;
  releasedCount: number;
  totalCount: number;
}

export interface HoldReasonEntry {
  reason: string;
  count: number;
}

export interface ExecutiveDashboard {
  productionSummary: ProductionSummary;
  orderFulfillment: OrderFulfillment;
  inventoryBalance: InventoryBalance;
  holdAnalysis: HoldAnalysis;
  topCycleTimes: CycleTimeEntry[];
}
