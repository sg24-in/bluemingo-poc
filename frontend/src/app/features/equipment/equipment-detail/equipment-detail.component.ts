import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Equipment } from '../../../shared/models';

@Component({
  selector: 'app-equipment-detail',
  templateUrl: './equipment-detail.component.html',
  styleUrls: ['./equipment-detail.component.css']
})
export class EquipmentDetailComponent implements OnInit {
  equipment: Equipment | null = null;
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
      this.loadEquipment(+idParam);
    } else {
      this.error = 'No equipment ID provided';
      this.loading = false;
    }
  }

  loadEquipment(equipmentId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getEquipmentById(equipmentId).subscribe({
      next: (equipment) => {
        this.equipment = equipment;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading equipment:', err);
        this.error = 'Failed to load equipment';
        this.loading = false;
      }
    });
  }

  editEquipment(): void {
    if (this.equipment) {
      this.router.navigate(['/manage/equipment', this.equipment.equipmentId, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/manage/equipment']);
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return 'status-available';
      case 'IN_USE':
        return 'status-in-use';
      case 'MAINTENANCE':
        return 'status-maintenance';
      case 'ON_HOLD':
        return 'status-on-hold';
      default:
        return '';
    }
  }

  startMaintenance(): void {
    if (!this.equipment) return;

    const reason = prompt('Enter maintenance reason:');
    if (reason) {
      this.apiService.startEquipmentMaintenance(this.equipment.equipmentId, reason).subscribe({
        next: () => {
          this.loadEquipment(this.equipment!.equipmentId);
        },
        error: (err) => {
          console.error('Error starting maintenance:', err);
          this.error = 'Failed to start maintenance';
        }
      });
    }
  }

  endMaintenance(): void {
    if (!this.equipment) return;

    this.apiService.endEquipmentMaintenance(this.equipment.equipmentId).subscribe({
      next: () => {
        this.loadEquipment(this.equipment!.equipmentId);
      },
      error: (err) => {
        console.error('Error ending maintenance:', err);
        this.error = 'Failed to end maintenance';
      }
    });
  }

  putOnHold(): void {
    if (!this.equipment) return;

    const reason = prompt('Enter hold reason:');
    if (reason) {
      this.apiService.putEquipmentOnHold(this.equipment.equipmentId, reason).subscribe({
        next: () => {
          this.loadEquipment(this.equipment!.equipmentId);
        },
        error: (err) => {
          console.error('Error putting on hold:', err);
          this.error = 'Failed to put on hold';
        }
      });
    }
  }

  releaseFromHold(): void {
    if (!this.equipment) return;

    this.apiService.releaseEquipmentFromHold(this.equipment.equipmentId).subscribe({
      next: () => {
        this.loadEquipment(this.equipment!.equipmentId);
      },
      error: (err) => {
        console.error('Error releasing from hold:', err);
        this.error = 'Failed to release from hold';
      }
    });
  }
}
