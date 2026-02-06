import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Customer } from '../../../shared/models';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css']
})
export class CustomerFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  customerId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.customerId = +id;
      this.form.get('customerCode')?.disable();
      this.loadCustomer();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      customerCode: ['', [Validators.required, Validators.maxLength(50)]],
      customerName: ['', [Validators.required, Validators.maxLength(200)]],
      contactPerson: ['', Validators.maxLength(100)],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      phone: ['', Validators.maxLength(20)],
      address: ['', Validators.maxLength(500)],
      city: ['', Validators.maxLength(100)],
      country: ['', Validators.maxLength(100)],
      taxId: ['', Validators.maxLength(50)],
      status: ['ACTIVE']
    });

  }

  loadCustomer(): void {
    if (!this.customerId) return;

    this.loading = true;
    this.apiService.getCustomerById(this.customerId).subscribe({
      next: (customer: Customer) => {
        this.form.patchValue({
          customerCode: customer.customerCode,
          customerName: customer.customerName,
          contactPerson: customer.contactPerson || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          country: customer.country || '',
          taxId: customer.taxId || '',
          status: customer.status
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load customer.';
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

    if (this.isEditMode && this.customerId) {
      const updateRequest = {
        customerCode: formValue.customerCode,
        customerName: formValue.customerName,
        contactPerson: formValue.contactPerson || undefined,
        email: formValue.email || undefined,
        phone: formValue.phone || undefined,
        address: formValue.address || undefined,
        city: formValue.city || undefined,
        country: formValue.country || undefined,
        taxId: formValue.taxId || undefined,
        status: formValue.status
      };

      this.apiService.updateCustomer(this.customerId, updateRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/customers']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to update customer.';
        }
      });
    } else {
      const createRequest = {
        customerCode: formValue.customerCode,
        customerName: formValue.customerName,
        contactPerson: formValue.contactPerson || undefined,
        email: formValue.email || undefined,
        phone: formValue.phone || undefined,
        address: formValue.address || undefined,
        city: formValue.city || undefined,
        country: formValue.country || undefined,
        taxId: formValue.taxId || undefined
      };

      this.apiService.createCustomer(createRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/customers']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to create customer.';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/manage/customers']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `${field} is required`;
    if (control.errors['maxlength']) return `${field} is too long`;
    if (control.errors['email']) return 'Invalid email format';

    return 'Invalid value';
  }
}
