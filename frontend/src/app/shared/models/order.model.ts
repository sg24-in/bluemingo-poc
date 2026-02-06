/**
 * Order Models - Must match backend OrderDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

import { OrderStatusType, OrderLineStatusType } from '../constants/status.constants';
import { ProcessSummary } from './process.model';
import { OperationBrief } from './operation.model';

/**
 * Matches: OrderDTO
 */
export interface Order {
  orderId: number;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  orderDate?: string; // LocalDate
  status: OrderStatusType;
  lineItems?: OrderLineItem[];
}

/**
 * Matches: OrderDTO.OrderLineDTO
 */
export interface OrderLineItem {
  orderLineId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unit: string;
  deliveryDate?: string; // LocalDate
  status: OrderLineStatusType;
  processes?: ProcessSummary[];
  currentProcess?: ProcessSummary;
  currentOperation?: OperationBrief;
}
