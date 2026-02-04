/**
 * Unit of Measure Model - Matches backend UnitOfMeasure enum.
 */

export interface UnitOption {
  value: string;
  label: string;
  category: 'weight' | 'count' | 'volume' | 'length' | 'area' | 'packaging';
}

/**
 * Standard units of measure used across the MES system.
 */
export const UNITS_OF_MEASURE: UnitOption[] = [
  // Weight
  { value: 'KG', label: 'Kilogram (KG)', category: 'weight' },
  { value: 'MT', label: 'Metric Ton (MT)', category: 'weight' },
  { value: 'LB', label: 'Pound (LB)', category: 'weight' },
  { value: 'G', label: 'Gram (G)', category: 'weight' },

  // Count
  { value: 'PCS', label: 'Pieces (PCS)', category: 'count' },
  { value: 'EA', label: 'Each (EA)', category: 'count' },

  // Volume
  { value: 'L', label: 'Liter (L)', category: 'volume' },
  { value: 'ML', label: 'Milliliter (ML)', category: 'volume' },
  { value: 'GAL', label: 'Gallon (GAL)', category: 'volume' },

  // Length
  { value: 'M', label: 'Meter (M)', category: 'length' },
  { value: 'CM', label: 'Centimeter (CM)', category: 'length' },
  { value: 'MM', label: 'Millimeter (MM)', category: 'length' },
  { value: 'FT', label: 'Feet (FT)', category: 'length' },
  { value: 'IN', label: 'Inch (IN)', category: 'length' },

  // Area & Volume
  { value: 'M2', label: 'Square Meter (M2)', category: 'area' },
  { value: 'M3', label: 'Cubic Meter (M3)', category: 'area' },

  // Packaging
  { value: 'BOX', label: 'Box (BOX)', category: 'packaging' },
  { value: 'BAG', label: 'Bag (BAG)', category: 'packaging' },
  { value: 'ROLL', label: 'Roll (ROLL)', category: 'packaging' },
  { value: 'SET', label: 'Set (SET)', category: 'packaging' }
];

/**
 * Get unit options by category.
 */
export function getUnitsByCategory(category: UnitOption['category']): UnitOption[] {
  return UNITS_OF_MEASURE.filter(unit => unit.category === category);
}

/**
 * Get unit label by value.
 */
export function getUnitLabel(value: string): string {
  const unit = UNITS_OF_MEASURE.find(u => u.value === value);
  return unit ? unit.label : value;
}

/**
 * Check if a value is a valid unit of measure.
 */
export function isValidUnit(value: string): boolean {
  return UNITS_OF_MEASURE.some(u => u.value === value);
}
