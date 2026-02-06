import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Product } from '../../../shared/models';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
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
      this.loadProduct(+idParam);
    } else {
      this.error = 'No product ID provided';
      this.loading = false;
    }
  }

  loadProduct(productId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getProductById(productId).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.error = 'Failed to load product';
        this.loading = false;
      }
    });
  }

  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/manage/products', this.product.productId, 'edit']);
    }
  }

  viewBom(): void {
    if (this.product) {
      this.router.navigate(['/manage/bom', this.product.sku]);
    }
  }

  goBack(): void {
    this.router.navigate(['/manage/products']);
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
    if (!this.product) return;

    if (this.product.status === 'ACTIVE') {
      if (confirm(`Are you sure you want to deactivate product "${this.product.productName}"?`)) {
        this.apiService.deleteProduct(this.product.productId).subscribe({
          next: () => {
            this.loadProduct(this.product!.productId);
          },
          error: (err) => {
            console.error('Error deactivating product:', err);
            this.error = 'Failed to deactivate product';
          }
        });
      }
    } else {
      this.apiService.activateProduct(this.product.productId).subscribe({
        next: () => {
          this.loadProduct(this.product!.productId);
        },
        error: (err) => {
          console.error('Error activating product:', err);
          this.error = 'Failed to activate product';
        }
      });
    }
  }
}
