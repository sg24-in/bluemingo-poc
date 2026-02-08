import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MaterialSelectionModalComponent, InventoryItem, MaterialSelection } from './material-selection-modal.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

describe('MaterialSelectionModalComponent', () => {
  let component: MaterialSelectionModalComponent;
  let fixture: ComponentFixture<MaterialSelectionModalComponent>;

  const mockInventory: InventoryItem[] = [
    { inventoryId: 1, batchId: 1, batchNumber: 'RM-2024-001', materialId: 'RM-SCRAP-001', quantity: 100, unit: 'T', state: 'AVAILABLE' },
    { inventoryId: 2, batchId: 2, batchNumber: 'RM-2024-002', materialId: 'RM-IRON-001', quantity: 200, unit: 'T', state: 'AVAILABLE' },
    { inventoryId: 3, batchId: 3, batchNumber: 'IM-2024-001', materialId: 'IM-BILLET-001', quantity: 50, unit: 'T', state: 'AVAILABLE' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MaterialSelectionModalComponent, StatusBadgeComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialSelectionModalComponent);
    component = fixture.componentInstance;
    component.availableInventory = mockInventory;
    // Manually trigger ngOnChanges since we're setting inputs directly
    component.ngOnChanges({
      availableInventory: {
        currentValue: mockInventory,
        previousValue: [],
        firstChange: true,
        isFirstChange: () => true
      }
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should extract material types from inventory', () => {
      expect(component.materialTypes).toContain('RM');
      expect(component.materialTypes).toContain('IM');
    });

    it('should initialize with empty selections', () => {
      expect(component.selectedCount).toBe(0);
    });

    it('should initialize existing selections from input', () => {
      const existingSelections: MaterialSelection[] = [
        { inventoryId: 1, batchId: 1, batchNumber: 'RM-2024-001', materialId: 'RM-SCRAP-001', availableQuantity: 100, quantityToConsume: 50 }
      ];
      component.selectedMaterials = existingSelections;
      component.ngOnChanges({ selectedMaterials: { currentValue: existingSelections, previousValue: [], firstChange: false, isFirstChange: () => false } });

      expect(component.selectedCount).toBe(1);
      expect(component.isSelected(1)).toBeTrue();
    });
  });

  describe('Filtering', () => {
    it('should filter inventory by search term', () => {
      component.searchTerm = 'SCRAP';
      expect(component.filteredInventory.length).toBe(1);
      expect(component.filteredInventory[0].materialId).toBe('RM-SCRAP-001');
    });

    it('should filter inventory by material type', () => {
      component.filterMaterialType = 'IM';
      expect(component.filteredInventory.length).toBe(1);
      expect(component.filteredInventory[0].materialId).toBe('IM-BILLET-001');
    });

    it('should combine search and type filters', () => {
      component.searchTerm = '2024';
      component.filterMaterialType = 'RM';
      expect(component.filteredInventory.length).toBe(2);
    });

    it('should clear filters', () => {
      component.searchTerm = 'test';
      component.filterMaterialType = 'RM';
      component.clearFilters();
      expect(component.searchTerm).toBe('');
      expect(component.filterMaterialType).toBe('');
    });
  });

  describe('Selection', () => {
    it('should toggle selection on', () => {
      component.toggleSelection(mockInventory[0]);
      expect(component.isSelected(1)).toBeTrue();
      expect(component.selectedCount).toBe(1);
    });

    it('should toggle selection off', () => {
      component.toggleSelection(mockInventory[0]);
      component.toggleSelection(mockInventory[0]);
      expect(component.isSelected(1)).toBeFalse();
      expect(component.selectedCount).toBe(0);
    });

    it('should select all visible items', () => {
      component.selectAll();
      expect(component.selectedCount).toBe(3);
    });

    it('should clear all selections', () => {
      component.selectAll();
      component.clearAll();
      expect(component.selectedCount).toBe(0);
    });

    it('should update quantity for selected item', () => {
      component.toggleSelection(mockInventory[0]);
      component.updateQuantity(1, 50);
      expect(component.getSelectedQuantity(1)).toBe(50);
    });

    it('should not exceed available quantity', () => {
      component.toggleSelection(mockInventory[0]);
      component.updateQuantity(1, 150); // More than available (100)
      expect(component.getSelectedQuantity(1)).toBe(100);
    });

    it('should not allow negative quantity', () => {
      component.toggleSelection(mockInventory[0]);
      component.updateQuantity(1, -10);
      expect(component.getSelectedQuantity(1)).toBe(0);
    });
  });

  describe('Total Calculations', () => {
    it('should calculate total selected quantity', () => {
      component.toggleSelection(mockInventory[0]);
      component.toggleSelection(mockInventory[1]);
      component.updateQuantity(1, 50);
      component.updateQuantity(2, 75);
      expect(component.totalSelectedQuantity).toBe(125);
    });
  });

  describe('Modal Actions', () => {
    it('should emit close event on cancel', () => {
      spyOn(component.close, 'emit');
      component.onCancel();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should emit selections and close on confirm', () => {
      spyOn(component.selectionChange, 'emit');
      spyOn(component.close, 'emit');

      component.toggleSelection(mockInventory[0]);
      component.updateQuantity(1, 50);
      component.onConfirm();

      expect(component.selectionChange.emit).toHaveBeenCalled();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should reset selections on cancel', () => {
      const existingSelections: MaterialSelection[] = [
        { inventoryId: 1, batchId: 1, batchNumber: 'RM-2024-001', materialId: 'RM-SCRAP-001', availableQuantity: 100, quantityToConsume: 50 }
      ];
      component.selectedMaterials = existingSelections;
      component.ngOnChanges({ selectedMaterials: { currentValue: existingSelections, previousValue: [], firstChange: false, isFirstChange: () => false } });

      // Make changes
      component.toggleSelection(mockInventory[1]);
      expect(component.selectedCount).toBe(2);

      // Cancel should reset
      component.onCancel();
      expect(component.selectedCount).toBe(1);
    });
  });

  describe('Backdrop Click', () => {
    it('should close modal on backdrop click', () => {
      spyOn(component, 'onCancel');
      const mockEvent = { target: { classList: { contains: () => true } } } as any;
      component.onBackdropClick(mockEvent);
      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should not close modal on content click', () => {
      spyOn(component, 'onCancel');
      const mockEvent = { target: { classList: { contains: () => false } } } as any;
      component.onBackdropClick(mockEvent);
      expect(component.onCancel).not.toHaveBeenCalled();
    });
  });
});
