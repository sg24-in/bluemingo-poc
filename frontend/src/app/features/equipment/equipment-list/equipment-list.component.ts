import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Equipment } from '../../../shared/models';
import { PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-equipment-list',
  templateUrl: './equipment-list.component.html',
  styleUrls: ['./equipment-list.component.css']
})
export class EquipmentListComponent implements OnInit {
  equipment: Equipment[] = [];
  loading = true;

  // Pagination state
  page = 0;
  size = DEFAULT_PAGE_SIZE;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  // Filter state
  filterStatus = '';
  filterType = '';
  searchTerm = '';

  // Modal states
  showMaintenanceModal = false;
  showHoldModal = false;
  selectedEquipment: Equipment | null = null;
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

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'equipmentCode',
      sortDirection: 'ASC',
      status: this.filterStatus || undefined,
      type: this.filterType || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getEquipmentPaged(request).subscribe({
      next: (response: PagedResponse<Equipment>) => {
        this.equipment = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading equipment:', err);
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadEquipment();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadEquipment();
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status === 'all' ? '' : status;
    this.page = 0;
    this.loadEquipment();
  }

  onFilterTypeChange(type: string): void {
    this.filterType = type === 'all' ? '' : type;
    this.page = 0;
    this.loadEquipment();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadEquipment();
  }

  // Maintenance actions
  openMaintenanceModal(item: Equipment): void {
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

    if (!this.selectedEquipment) return;

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

  endMaintenance(item: Equipment): void {
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
  openHoldModal(item: Equipment): void {
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

    if (!this.selectedEquipment) return;

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

  releaseFromHold(item: Equipment): void {
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
  canStartMaintenance(item: Equipment): boolean {
    return item.status === 'AVAILABLE' || item.status === 'ON_HOLD';
  }

  canEndMaintenance(item: Equipment): boolean {
    return item.status === 'MAINTENANCE';
  }

  canPutOnHold(item: Equipment): boolean {
    return item.status === 'AVAILABLE' || item.status === 'MAINTENANCE';
  }

  canReleaseFromHold(item: Equipment): boolean {
    return item.status === 'ON_HOLD';
  }
}
