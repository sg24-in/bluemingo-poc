import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { BomProductSummary } from '../../../shared/models';

@Component({
  selector: 'app-bom-list',
  templateUrl: './bom-list.component.html',
  styleUrls: ['./bom-list.component.css']
})
export class BomListComponent implements OnInit {
  products: BomProductSummary[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.apiService.getBomProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load BOM products';
        this.loading = false;
        console.error('Error loading BOM products:', err);
      }
    });
  }

  viewTree(productSku: string): void {
    this.router.navigate(['/manage/bom', productSku, 'tree']);
  }

  addNode(productSku: string): void {
    this.router.navigate(['/manage/bom', productSku, 'node', 'new']);
  }

  createNewBom(): void {
    this.router.navigate(['/manage/bom', 'create']);
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'status-active';
      case 'EMPTY':
        return 'status-empty';
      case 'INACTIVE':
        return 'status-inactive';
      case 'DRAFT':
        return 'status-draft';
      case 'OBSOLETE':
        return 'status-obsolete';
      default:
        return '';
    }
  }
}
