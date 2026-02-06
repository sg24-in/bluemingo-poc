import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Customer } from '../../../shared/models';

@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.css']
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadCustomer(+idParam);
    } else {
      this.error = 'No customer ID provided';
      this.loading = false;
    }
  }

  loadCustomer(customerId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getCustomerById(customerId).subscribe({
      next: (customer) => {
        this.customer = customer;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading customer:', err);
        this.error = 'Failed to load customer';
        this.loading = false;
      }
    });
  }

  editCustomer(): void {
    if (this.customer) {
      this.router.navigate(['/manage/customers', this.customer.customerId, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/manage/customers']);
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'status-active';
      case 'INACTIVE':
        return 'status-inactive';
      default:
        return '';
    }
  }

  toggleStatus(): void {
    if (!this.customer) return;

    if (this.customer.status === 'ACTIVE') {
      if (confirm(`Are you sure you want to deactivate customer "${this.customer.customerName}"?`)) {
        this.apiService.deleteCustomer(this.customer.customerId).subscribe({
          next: () => {
            this.loadCustomer(this.customer!.customerId);
          },
          error: (err) => {
            console.error('Error deactivating customer:', err);
            this.error = 'Failed to deactivate customer';
          }
        });
      }
    } else {
      this.apiService.activateCustomer(this.customer.customerId).subscribe({
        next: () => {
          this.loadCustomer(this.customer!.customerId);
        },
        error: (err) => {
          console.error('Error activating customer:', err);
          this.error = 'Failed to activate customer';
        }
      });
    }
  }
}
