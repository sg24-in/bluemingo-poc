import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { InventoryBalance } from '../../../shared/models';

@Component({
  selector: 'app-inventory-balance',
  templateUrl: './inventory-balance.component.html',
  styleUrls: ['./inventory-balance.component.css']
})
export class InventoryBalanceComponent implements OnInit {
  loading = true;
  error = '';
  balanceData: InventoryBalance | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getInventoryBalance().subscribe({
      next: (data) => {
        this.balanceData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load inventory balance data';
        this.loading = false;
      }
    });
  }

  getStateClass(state: string): string {
    switch (state?.toUpperCase()) {
      case 'AVAILABLE': return 'state-available';
      case 'CONSUMED': return 'state-consumed';
      case 'BLOCKED': return 'state-blocked';
      case 'RESERVED': return 'state-reserved';
      case 'PRODUCED': return 'state-produced';
      case 'SCRAPPED': return 'state-scrapped';
      default: return '';
    }
  }

  getTypeLabel(type: string): string {
    switch (type?.toUpperCase()) {
      case 'RM': return 'Raw Material';
      case 'WIP': return 'Work in Progress';
      case 'IM': return 'Intermediate';
      case 'FG': return 'Finished Goods';
      default: return type;
    }
  }
}
