import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import {
  OperationTemplate,
  OPERATION_TYPES,
  QUANTITY_TYPES
} from '../../../shared/models/operation-template.model';

@Component({
  selector: 'app-operation-template-detail',
  templateUrl: './operation-template-detail.component.html',
  styleUrls: ['./operation-template-detail.component.css']
})
export class OperationTemplateDetailComponent implements OnInit {
  template: OperationTemplate | null = null;
  loading = true;
  error: string | null = null;

  operationTypes = OPERATION_TYPES;
  quantityTypes = QUANTITY_TYPES;

  equipmentTypes = [
    { value: 'EAF', label: 'Electric Arc Furnace' },
    { value: 'CASTER', label: 'Continuous Caster' },
    { value: 'HOT_MILL', label: 'Hot Rolling Mill' },
    { value: 'COLD_MILL', label: 'Cold Rolling Mill' },
    { value: 'ANNEALING', label: 'Annealing Furnace' },
    { value: 'COATING', label: 'Coating Line' },
    { value: 'SLITTER', label: 'Slitter' },
    { value: 'SHEAR', label: 'Shear Line' },
    { value: 'INSPECTION', label: 'Inspection Station' },
    { value: 'GENERAL', label: 'General Equipment' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadTemplate(+idParam);
    } else {
      this.error = 'No operation template ID provided';
      this.loading = false;
    }
  }

  loadTemplate(templateId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getOperationTemplateById(templateId).subscribe({
      next: (template) => {
        this.template = template;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading operation template:', err);
        this.error = 'Failed to load operation template';
        this.loading = false;
      }
    });
  }

  editTemplate(): void {
    if (this.template) {
      this.router.navigate(['/manage/operation-templates', this.template.operationTemplateId, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/manage/operation-templates']);
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

  getOperationTypeLabel(type: string): string {
    const found = this.operationTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getQuantityTypeLabel(type: string): string {
    const found = this.quantityTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getEquipmentTypeLabel(type: string): string {
    const found = this.equipmentTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  toggleStatus(): void {
    if (!this.template) return;

    if (this.template.status === 'ACTIVE') {
      if (confirm(`Are you sure you want to deactivate template "${this.template.operationName}"?`)) {
        this.apiService.deactivateOperationTemplate(this.template.operationTemplateId).subscribe({
          next: () => {
            this.loadTemplate(this.template!.operationTemplateId);
          },
          error: (err) => {
            console.error('Error deactivating template:', err);
            this.error = 'Failed to deactivate operation template';
          }
        });
      }
    } else {
      this.apiService.activateOperationTemplate(this.template.operationTemplateId).subscribe({
        next: () => {
          this.loadTemplate(this.template!.operationTemplateId);
        },
        error: (err) => {
          console.error('Error activating template:', err);
          this.error = 'Failed to activate operation template';
        }
      });
    }
  }
}
