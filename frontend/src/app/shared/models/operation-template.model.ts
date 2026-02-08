/**
 * OperationTemplate Models - Design-time operation definitions.
 *
 * OperationTemplate is a TEMPLATE entity (design-time only).
 * It defines reusable operation definitions that are:
 * - Referenced by RoutingSteps
 * - Used to instantiate runtime Operations
 */

/**
 * Full operation template response.
 * Matches: OperationTemplateDTO.Response
 */
export interface OperationTemplate {
  operationTemplateId: number;
  operationName: string;
  operationCode?: string;
  operationType: string;
  quantityType: string;
  defaultEquipmentType?: string;
  description?: string;
  estimatedDurationMinutes?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
}

/**
 * Request for creating an operation template.
 * Matches: OperationTemplateDTO.CreateRequest
 */
export interface CreateOperationTemplateRequest {
  operationName: string;
  operationCode?: string;
  operationType: string;
  quantityType?: string;
  defaultEquipmentType?: string;
  description?: string;
  estimatedDurationMinutes?: number;
}

/**
 * Request for updating an operation template.
 * Matches: OperationTemplateDTO.UpdateRequest
 */
export interface UpdateOperationTemplateRequest {
  operationName?: string;
  operationCode?: string;
  operationType?: string;
  quantityType?: string;
  defaultEquipmentType?: string;
  description?: string;
  estimatedDurationMinutes?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

/**
 * Summary for dropdown/list views.
 * Matches: OperationTemplateDTO.Summary
 */
export interface OperationTemplateSummary {
  operationTemplateId: number;
  operationName: string;
  operationCode?: string;
  operationType: string;
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * Operation types for dropdown.
 */
export const OPERATION_TYPES = [
  { value: 'FURNACE', label: 'Furnace' },
  { value: 'CASTER', label: 'Caster' },
  { value: 'ROLLING', label: 'Rolling' },
  { value: 'HEAT_TREATMENT', label: 'Heat Treatment' },
  { value: 'COATING', label: 'Coating' },
  { value: 'FINISHING', label: 'Finishing' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'CUTTING', label: 'Cutting' },
  { value: 'WELDING', label: 'Welding' },
  { value: 'ASSEMBLY', label: 'Assembly' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'GENERAL', label: 'General' }
];

/**
 * Quantity types for dropdown.
 */
export const QUANTITY_TYPES = [
  { value: 'DISCRETE', label: 'Discrete' },
  { value: 'BATCH', label: 'Batch' },
  { value: 'CONTINUOUS', label: 'Continuous' }
];
