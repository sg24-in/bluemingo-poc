import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css']
})
export class InventoryListComponent implements OnInit {
  inventory: any[] = [];
  filteredInventory: any[] = [];
  loading = true;

  filterState = 'all';
  filterType = 'all';
  searchTerm = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading = true;
    this.apiService.getAllInventory().subscribe({
      next: (data) => {
        this.inventory = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredInventory = this.inventory.filter(item => {
      const matchState = this.filterState === 'all' || item.state === this.filterState;
      const matchType = this.filterType === 'all' || item.inventoryType === this.filterType;
      const matchSearch = !this.searchTerm ||
        item.batchNumber?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.materialId?.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchState && matchType && matchSearch;
    });
  }

  onFilterStateChange(state: string): void {
    this.filterState = state;
    this.applyFilters();
  }

  onFilterTypeChange(type: string): void {
    this.filterType = type;
    this.applyFilters();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  getStateSummary(): { state: string; count: number }[] {
    const summary: { [key: string]: number } = {};
    this.inventory.forEach(item => {
      summary[item.state] = (summary[item.state] || 0) + 1;
    });
    return Object.entries(summary).map(([state, count]) => ({ state, count }));
  }

  getTypeSummary(): { type: string; count: number }[] {
    const summary: { [key: string]: number } = {};
    this.inventory.forEach(item => {
      summary[item.inventoryType] = (summary[item.inventoryType] || 0) + 1;
    });
    return Object.entries(summary).map(([type, count]) => ({ type, count }));
  }
}
