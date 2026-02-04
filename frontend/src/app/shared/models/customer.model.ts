/**
 * Customer Model - Matches backend CustomerDTO.
 */

export interface Customer {
  customerId: number;
  customerCode: string;
  customerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdOn?: string;
  updatedOn?: string;
}

export interface CreateCustomerRequest {
  customerCode: string;
  customerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
}

export interface UpdateCustomerRequest {
  customerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
