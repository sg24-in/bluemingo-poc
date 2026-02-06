import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Material } from '../../../shared/models';

@Component({
  selector: 'app-material-detail',
  templateUrl: './material-detail.component.html',
  styleUrls: ['./material-detail.component.css']
})
export class MaterialDetailComponent implements OnInit {
  material: Material | null = null;
  loading = true;
  error: string | null = null;

  // Material type display names
  materialTypeLabels: Record<string, string> = {
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
      this.loadMaterial(+idParam);
    } else {
      this.error = 'No material ID provided';
      this.loading = false;
    }
  }

  loadMaterial(materialId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getMaterialById(materialId).subscribe({
      next: (material) => {
        this.material = material;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading material:', err);
        this.error = 'Failed to load material';
        this.loading = false;
      }
    });
  }

  editMaterial(): void {
    if (this.material) {
      this.router.navigate(['/manage/materials', this.material.materialId, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/manage/materials']);
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

  getMaterialTypeLabel(type: string): string {
    return this.materialTypeLabels[type] || type;
  }

  getMaterialTypeClass(type: string): string {
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

  toggleStatus(): void {
    if (!this.material) return;

    if (this.material.status === 'ACTIVE') {
      if (confirm(`Are you sure you want to deactivate material "${this.material.materialName}"?`)) {
        this.apiService.deleteMaterial(this.material.materialId).subscribe({
          next: () => {
            this.loadMaterial(this.material!.materialId);
          },
          error: (err) => {
            console.error('Error deactivating material:', err);
            this.error = 'Failed to deactivate material';
          }
        });
      }
    } else {
      this.apiService.activateMaterial(this.material.materialId).subscribe({
        next: () => {
          this.loadMaterial(this.material!.materialId);
        },
        error: (err) => {
          console.error('Error activating material:', err);
          this.error = 'Failed to activate material';
        }
      });
    }
  }
}
