import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';

export interface InventoryItem {
  inventoryId: number;
  batchId: number;
  batchNumber: string;
  materialId: string;
  materialName?: string;
  quantity: number;
  unit: string;
  state: string;
  location?: string;
}

export interface MaterialSelection {
  inventoryId: number;
  batchId: number;
  batchNumber: string;
  materialId: string;
  availableQuantity: number;
  quantityToConsume: number;
}

@Component({
  selector: 'app-material-selection-modal',
  templateUrl: './material-selection-modal.component.html',
  styleUrls: ['./material-selection-modal.component.css']
})
export class MaterialSelectionModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() availableInventory: InventoryItem[] = [];
  @Input() selectedMaterials: MaterialSelection[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<MaterialSelection[]>();

  // Search and filter
  searchTerm = '';
  filterMaterialType = '';

  // Local selection state
  localSelections: Map<number, MaterialSelection> = new Map();

  // Unique material types for filter dropdown
  materialTypes: string[] = [];

  ngOnInit(): void {
    this.initializeSelections();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMaterials'] || changes['availableInventory']) {
      this.initializeSelections();
    }
    if (changes['availableInventory']) {
      this.extractMaterialTypes();
    }
  }

  private initializeSelections(): void {
    this.localSelections.clear();
    this.selectedMaterials.forEach(sel => {
      this.localSelections.set(sel.inventoryId, { ...sel });
    });
  }

  private extractMaterialTypes(): void {
    const types = new Set<string>();
    this.availableInventory.forEach(inv => {
      if (inv.materialId) {
        // Extract material type prefix (e.g., "RM" from "RM-001")
        const prefix = inv.materialId.split('-')[0];
        types.add(prefix);
      }
    });
    this.materialTypes = Array.from(types).sort();
  }

  get filteredInventory(): InventoryItem[] {
    return this.availableInventory.filter(inv => {
      // Search filter
      const searchMatch = !this.searchTerm ||
        inv.batchNumber?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        inv.materialId?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        inv.materialName?.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Material type filter
      const typeMatch = !this.filterMaterialType ||
        inv.materialId?.startsWith(this.filterMaterialType);

      return searchMatch && typeMatch;
    });
  }

  isSelected(inventoryId: number): boolean {
    return this.localSelections.has(inventoryId);
  }

  getSelectedQuantity(inventoryId: number): number {
    return this.localSelections.get(inventoryId)?.quantityToConsume || 0;
  }

  toggleSelection(item: InventoryItem): void {
    if (this.localSelections.has(item.inventoryId)) {
      this.localSelections.delete(item.inventoryId);
    } else {
      this.localSelections.set(item.inventoryId, {
        inventoryId: item.inventoryId,
        batchId: item.batchId,
        batchNumber: item.batchNumber,
        materialId: item.materialId,
        availableQuantity: item.quantity,
        quantityToConsume: 0
      });
    }
  }

  updateQuantity(inventoryId: number, quantity: number): void {
    const selection = this.localSelections.get(inventoryId);
    if (selection) {
      selection.quantityToConsume = Math.min(Math.max(0, quantity), selection.availableQuantity);
    }
  }

  selectAll(): void {
    this.filteredInventory.forEach(item => {
      if (!this.localSelections.has(item.inventoryId)) {
        this.localSelections.set(item.inventoryId, {
          inventoryId: item.inventoryId,
          batchId: item.batchId,
          batchNumber: item.batchNumber,
          materialId: item.materialId,
          availableQuantity: item.quantity,
          quantityToConsume: 0
        });
      }
    });
  }

  clearAll(): void {
    this.localSelections.clear();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterMaterialType = '';
  }

  get selectedCount(): number {
    return this.localSelections.size;
  }

  get totalSelectedQuantity(): number {
    let total = 0;
    this.localSelections.forEach(sel => {
      total += sel.quantityToConsume;
    });
    return total;
  }

  onConfirm(): void {
    const selections = Array.from(this.localSelections.values());
    this.selectionChange.emit(selections);
    this.close.emit();
  }

  onCancel(): void {
    this.initializeSelections(); // Reset to original
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onCancel();
    }
  }
}
