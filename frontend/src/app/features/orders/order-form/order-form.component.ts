import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Order, Customer, Product } from '../../../shared/models';

@Component({
  selector: 'app-order-form',
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.css']
})
export class OrderFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  orderId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  customers: Customer[] = [];
  products: Product[] = [];
  loadingCustomers = true;
  loadingProducts = true;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('orderId');
    if (id) {
      this.isEditMode = true;
      this.orderId = +id;
    }

    this.initForm();
    this.loadCustomers();
    this.loadProducts();

    if (this.isEditMode && this.orderId) {
      this.loadOrder();
    } else {
      // Add initial line item for new orders
      this.addLineItem();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      customerId: ['', Validators.required],
      customerName: ['', [Validators.required, Validators.maxLength(200)]],
      orderDate: [this.getTodayDate(), Validators.required],
      orderNumber: [''],
      status: ['CREATED'],
      lineItems: this.fb.array([])
    });
  }

  get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  createLineItemGroup(item?: any): FormGroup {
    return this.fb.group({
      orderLineId: [item?.orderLineId || null],
      productSku: [item?.productSku || '', [Validators.required, Validators.maxLength(50)]],
      productName: [item?.productName || '', [Validators.required, Validators.maxLength(200)]],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(0.01)]],
      unit: [item?.unit || '', [Validators.required, Validators.maxLength(20)]],
      deliveryDate: [item?.deliveryDate || '']
    });
  }

  addLineItem(): void {
    this.lineItems.push(this.createLineItemGroup());
  }

  removeLineItem(index: number): void {
    if (this.lineItems.length > 1) {
      this.lineItems.removeAt(index);
    }
  }

  loadCustomers(): void {
    this.apiService.getActiveCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.loadingCustomers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.loadingCustomers = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProducts(): void {
    this.apiService.getActiveProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loadingProducts = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loadingProducts = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCustomerChange(event: Event): void {
    const customerCode = (event.target as HTMLSelectElement).value;
    const customer = this.customers.find(c => c.customerCode === customerCode);
    if (customer) {
      this.form.patchValue({ customerName: customer.customerName });
    }
  }

  onProductChange(index: number, event: Event): void {
    const sku = (event.target as HTMLSelectElement).value;
    const product = this.products.find(p => p.sku === sku);
    if (product) {
      const lineItem = this.lineItems.at(index);
      lineItem.patchValue({
        productName: product.productName,
        unit: product.baseUnit
      });
    }
  }

  loadOrder(): void {
    if (!this.orderId) return;

    this.loading = true;
    this.apiService.getOrderById(this.orderId).subscribe({
      next: (order: Order) => {
        this.form.patchValue({
          customerId: order.customerId || '',
          customerName: order.customerName || '',
          orderDate: order.orderDate || '',
          orderNumber: order.orderNumber || '',
          status: order.status
        });

        // Clear and populate line items
        this.lineItems.clear();
        if (order.lineItems && order.lineItems.length > 0) {
          order.lineItems.forEach(item => {
            this.lineItems.push(this.createLineItemGroup(item));
          });
        } else {
          this.addLineItem();
        }

        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load order.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';

    const formValue = this.form.getRawValue();

    if (this.isEditMode && this.orderId) {
      // Update order - only basic info
      const updateRequest = {
        customerId: formValue.customerId,
        customerName: formValue.customerName,
        orderDate: formValue.orderDate || undefined,
        status: formValue.status
      };

      this.apiService.updateOrder(this.orderId, updateRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to update order.';
        }
      });
    } else {
      // Create new order
      const createRequest = {
        customerId: formValue.customerId,
        customerName: formValue.customerName,
        orderDate: formValue.orderDate,
        orderNumber: formValue.orderNumber || undefined,
        lineItems: formValue.lineItems.map((item: any) => ({
          productSku: item.productSku,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          deliveryDate: item.deliveryDate || undefined
        }))
      };

      this.apiService.createOrder(createRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to create order.';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/orders']);
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  hasLineItemError(index: number, field: string): boolean {
    const control = this.lineItems.at(index)?.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `${field} is required`;
    if (control.errors['maxlength']) return `${field} is too long`;

    return 'Invalid value';
  }

  canEditLineItems(): boolean {
    // Can only edit line items for CREATED orders
    return !this.isEditMode || this.form.get('status')?.value === 'CREATED';
  }

  trackByIndex(index: number): number {
    return index;
  }
}
