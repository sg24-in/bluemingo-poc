import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-equipment-list',
  templateUrl: './equipment-list.component.html',
  styleUrls: ['./equipment-list.component.css']
})
export class EquipmentListComponent implements OnInit {
  equipment: any[] = [];
  filteredEquipment: any[] = [];
  loading = true;

  filterStatus = 'all';
  filterType = 'all';
  searchTerm = '';

  // Modal states
  showMaintenanceModal = false;
  showHoldModal = false;
  selectedEquipment: any = null;
  actionReason = '';
  expectedEndTime = '';
  actionLoading = false;
  actionError = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadEquipment();
  }

  loadEquipment(): void {
    this.loading = true;
    this.apiService.getAllEquipment().subscribe({
      next: (data) => {
        this.equipment = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading equipment:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredEquipment = this.equipment.filter(item => {
      const matchStatus = this.filterStatus === 'all' || item.status === this.filterStatus;
      const matchType = this.filterType === 'all' || item.equipmentType === this.filterType;
      const matchSearch = !this.searchTerm ||
        item.equipmentCode?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.name?.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchStatus && matchType && matchSearch;
    });
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status;
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

  getStatusSummary(): { status: string; count: number }[] {
    const summary: { [key: string]: number } = {};
    this.equipment.forEach(item => {
      summary[item.status] = (summary[item.status] || 0) + 1;
    });
    return Object.entries(summary).map(([status, count]) => ({ status, count }));
  }

  // Maintenance actions
  openMaintenanceModal(item: any): void {
    this.selectedEquipment = item;
    this.actionReason = '';
    this.expectedEndTime = '';
    this.actionError = '';
    this.showMaintenanceModal = true;
  }

  closeMaintenanceModal(): void {
    this.showMaintenanceModal = false;
    this.selectedEquipment = null;
    this.actionReason = '';
    this.expectedEndTime = '';
    this.actionError = '';
  }

  confirmStartMaintenance(): void {
    if (!this.actionReason.trim()) {
      this.actionError = 'Please provide a reason for maintenance.';
      return;
    }

    this.actionLoading = true;
    this.actionError = '';

    this.apiService.startEquipmentMaintenance(
      this.selectedEquipment.equipmentId,
      this.actionReason,
      this.expectedEndTime || undefined
    ).subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeMaintenanceModal();
        this.loadEquipment();
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err.error?.message || 'Failed to start maintenance.';
      }
    });
  }

  endMaintenance(item: any): void {
    if (!confirm(`End maintenance for ${item.equipmentCode}?`)) {
      return;
    }

    this.loading = true;
    this.apiService.endEquipmentMaintenance(item.equipmentId).subscribe({
      next: () => {
        this.loadEquipment();
      },
      error: (err) => {
        this.loading = false;
        alert(err.error?.message || 'Failed to end maintenance.');
      }
    });
  }

  // Hold actions
  openHoldModal(item: any): void {
    this.selectedEquipment = item;
    this.actionReason = '';
    this.actionError = '';
    this.showHoldModal = true;
  }

  closeHoldModal(): void {
    this.showHoldModal = false;
    this.selectedEquipment = null;
    this.actionReason = '';
    this.actionError = '';
  }

  confirmPutOnHold(): void {
    if (!this.actionReason.trim()) {
      this.actionError = 'Please provide a reason for putting on hold.';
      return;
    }

    this.actionLoading = true;
    this.actionError = '';

    this.apiService.putEquipmentOnHold(this.selectedEquipment.equipmentId, this.actionReason).subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeHoldModal();
        this.loadEquipment();
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err.error?.message || 'Failed to put equipment on hold.';
      }
    });
  }

  releaseFromHold(item: any): void {
    if (!confirm(`Release ${item.equipmentCode} from hold?`)) {
      return;
    }

    this.loading = true;
    this.apiService.releaseEquipmentFromHold(item.equipmentId).subscribe({
      next: () => {
        this.loadEquipment();
      },
      error: (err) => {
        this.loading = false;
        alert(err.error?.message || 'Failed to release equipment from hold.');
      }
    });
  }

  // Helpers
  canStartMaintenance(item: any): boolean {
    return item.status === 'AVAILABLE' || item.status === 'ON_HOLD';
  }

  canEndMaintenance(item: any): boolean {
    return item.status === 'MAINTENANCE';
  }

  canPutOnHold(item: any): boolean {
    return item.status === 'AVAILABLE' || item.status === 'MAINTENANCE';
  }

  canReleaseFromHold(item: any): boolean {
    return item.status === 'ON_HOLD';
  }
}
