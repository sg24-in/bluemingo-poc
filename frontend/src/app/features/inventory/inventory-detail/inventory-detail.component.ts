import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Inventory } from '../../../shared/models';

@Component({
  selector: 'app-inventory-detail',
  templateUrl: './inventory-detail.component.html',
  styleUrls: ['./inventory-detail.component.css']
})
export class InventoryDetailComponent implements OnInit {
  inventory: Inventory | null = null;
  loading = true;
  error: string | null = null;

  // Inventory type display names
  typeLabels: Record<string, string> = {
    'RM': 'Raw Material',
    'IM': 'Intermediate',
    'FG': 'Finished Goods',
    'WIP': 'Work In Progress'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadInventory(+idParam);
    } else {
      this.error = 'No inventory ID provided';
      this.loading = false;
    }
  }

  loadInventory(inventoryId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getInventoryById(inventoryId).subscribe({
      next: (inventory) => {
        this.inventory = inventory;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.error = 'Failed to load inventory';
        this.loading = false;
      }
    });
  }

  editInventory(): void {
    if (this.inventory) {
      this.router.navigate(['/inventory', this.inventory.inventoryId, 'edit']);
    }
  }

  viewBatch(): void {
    if (this.inventory?.batchId) {
      this.router.navigate(['/batches', this.inventory.batchId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  getStateClass(state: string): string {
    switch (state?.toUpperCase()) {
      case 'AVAILABLE':
        return 'state-available';
      case 'CONSUMED':
        return 'state-consumed';
      case 'RESERVED':
        return 'state-reserved';
      case 'PRODUCED':
        return 'state-produced';
      case 'BLOCKED':
        return 'state-blocked';
      case 'SCRAPPED':
        return 'state-scrapped';
      default:
        return '';
    }
  }

  getTypeLabel(type: string): string {
    return this.typeLabels[type] || type;
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'RM':
        return 'type-rm';
      case 'IM':
        return 'type-im';
      case 'FG':
        return 'type-fg';
      case 'WIP':
        return 'type-wip';
      default:
        return '';
    }
  }

  blockInventory(): void {
    if (!this.inventory) return;

    const reason = prompt('Enter block reason:');
    if (reason) {
      this.apiService.blockInventory(this.inventory.inventoryId, reason).subscribe({
        next: () => {
          this.loadInventory(this.inventory!.inventoryId);
        },
        error: (err) => {
          console.error('Error blocking inventory:', err);
          this.error = 'Failed to block inventory';
        }
      });
    }
  }

  unblockInventory(): void {
    if (!this.inventory) return;

    this.apiService.unblockInventory(this.inventory.inventoryId).subscribe({
      next: () => {
        this.loadInventory(this.inventory!.inventoryId);
      },
      error: (err) => {
        console.error('Error unblocking inventory:', err);
        this.error = 'Failed to unblock inventory';
      }
    });
  }

  scrapInventory(): void {
    if (!this.inventory) return;

    const reason = prompt('Enter scrap reason:');
    if (reason) {
      if (confirm(`Are you sure you want to scrap this inventory? This action cannot be undone.`)) {
        this.apiService.scrapInventory(this.inventory.inventoryId, reason).subscribe({
          next: () => {
            this.loadInventory(this.inventory!.inventoryId);
          },
          error: (err) => {
            console.error('Error scrapping inventory:', err);
            this.error = 'Failed to scrap inventory';
          }
        });
      }
    }
  }
}
