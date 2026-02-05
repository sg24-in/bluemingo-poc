import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { BomTreeNode, CreateBomNodeRequest, UpdateBomNodeRequest, Material, Product } from '../../../shared/models';

@Component({
  selector: 'app-bom-node-form',
  templateUrl: './bom-node-form.component.html',
  styleUrls: ['./bom-node-form.component.css']
})
export class BomNodeFormComponent implements OnInit {
  form: FormGroup;
  productSku: string = '';
  bomId: number | null = null;
  parentBomId: number | null = null;
  isEditMode = false;
  isNewBom = false;
  loading = false;
  loadingNode = false;
  saving = false;
  error: string | null = null;
  materials: Material[] = [];
  products: Product[] = [];
  selectedProductSku: string = '';

  units = ['KG', 'T', 'PCS', 'M', 'L', 'MT'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {
    this.form = this.fb.group({
      materialId: ['', [Validators.required]],
      materialName: ['', [Validators.required]],
      quantityRequired: [1, [Validators.required, Validators.min(0.0001)]],
      unit: ['KG', [Validators.required]],
      yieldLossRatio: [1],
      sequenceLevel: [1, [Validators.required, Validators.min(1)]],
      bomVersion: ['V1'],
      status: ['ACTIVE']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productSku = params['productSku'];
      this.bomId = params['bomId'] ? +params['bomId'] : null;
      this.isEditMode = !!this.bomId;
      this.isNewBom = this.productSku === 'new';
    });

    this.route.queryParams.subscribe(queryParams => {
      this.parentBomId = queryParams['parentId'] ? +queryParams['parentId'] : null;
      if (this.parentBomId) {
        // When adding child, increment sequence level
        this.loadParentInfo();
      }
    });

    this.loadMaterials();

    // Load products for new BOM creation
    if (this.isNewBom) {
      this.loadProducts();
    }

    if (this.isEditMode && this.bomId) {
      this.loadNode();
    }
  }

  loadMaterials(): void {
    this.apiService.getActiveMaterials().subscribe({
      next: (materials) => {
        this.materials = materials;
      },
      error: (err) => {
        console.error('Error loading materials:', err);
      }
    });
  }

  loadProducts(): void {
    this.apiService.getActiveProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
  }

  onProductSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedProductSku = select.value;
  }

  loadParentInfo(): void {
    if (!this.parentBomId) return;

    this.apiService.getBomNode(this.parentBomId).subscribe({
      next: (parent) => {
        // Child should be one level deeper
        this.form.patchValue({
          sequenceLevel: parent.sequenceLevel + 1,
          bomVersion: parent.bomVersion
        });
      },
      error: (err) => {
        console.error('Error loading parent node:', err);
      }
    });
  }

  loadNode(): void {
    if (!this.bomId) return;

    this.loadingNode = true;
    this.apiService.getBomNode(this.bomId).subscribe({
      next: (node) => {
        this.form.patchValue({
          materialId: node.materialId,
          materialName: node.materialName,
          quantityRequired: node.quantityRequired,
          unit: node.unit,
          yieldLossRatio: node.yieldLossRatio || 1,
          sequenceLevel: node.sequenceLevel,
          bomVersion: node.bomVersion,
          status: node.status || 'ACTIVE'
        });
        this.parentBomId = node.parentBomId || null;
        this.loadingNode = false;
      },
      error: (err) => {
        this.error = 'Failed to load BOM node';
        this.loadingNode = false;
        console.error('Error loading node:', err);
      }
    });
  }

  onMaterialSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const materialId = select.value;
    const material = this.materials.find(m => m.materialCode === materialId);
    if (material) {
      this.form.patchValue({
        materialId: material.materialCode,
        materialName: material.materialName,
        unit: material.baseUnit || 'KG'
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    if (this.isEditMode && this.bomId) {
      this.updateNode();
    } else {
      this.createNode();
    }
  }

  private createNode(): void {
    // Determine product SKU
    let productSku = this.productSku;
    if (this.isNewBom) {
      if (!this.selectedProductSku) {
        this.error = 'Please select a product for the BOM';
        this.saving = false;
        return;
      }
      productSku = this.selectedProductSku;
    }

    const request: CreateBomNodeRequest = {
      productSku: productSku,
      bomVersion: this.form.value.bomVersion,
      materialId: this.form.value.materialId,
      materialName: this.form.value.materialName,
      quantityRequired: this.form.value.quantityRequired,
      unit: this.form.value.unit,
      yieldLossRatio: this.form.value.yieldLossRatio,
      sequenceLevel: this.form.value.sequenceLevel,
      parentBomId: this.parentBomId || undefined
    };

    this.apiService.createBomNode(request).subscribe({
      next: (node) => {
        this.saving = false;
        this.router.navigate(['/manage/bom', node.productSku, 'tree']);
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to create BOM node';
        console.error('Error creating node:', err);
      }
    });
  }

  private updateNode(): void {
    if (!this.bomId) return;

    const request: UpdateBomNodeRequest = {
      materialId: this.form.value.materialId,
      materialName: this.form.value.materialName,
      quantityRequired: this.form.value.quantityRequired,
      unit: this.form.value.unit,
      yieldLossRatio: this.form.value.yieldLossRatio,
      sequenceLevel: this.form.value.sequenceLevel,
      status: this.form.value.status
    };

    this.apiService.updateBomNode(this.bomId, request).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/manage/bom', this.productSku, 'tree']);
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to update BOM node';
        console.error('Error updating node:', err);
      }
    });
  }

  cancel(): void {
    if (this.productSku && this.productSku !== 'new') {
      this.router.navigate(['/manage/bom', this.productSku, 'tree']);
    } else {
      this.router.navigate(['/manage/bom']);
    }
  }

  get title(): string {
    if (this.isEditMode) {
      return 'Edit BOM Node';
    }
    if (this.isNewBom) {
      return 'Create New BOM';
    }
    return this.parentBomId ? 'Add Child Node' : 'Add BOM Node';
  }
}
