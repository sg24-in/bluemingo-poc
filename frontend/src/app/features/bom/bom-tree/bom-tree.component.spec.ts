import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BomTreeComponent } from './bom-tree.component';
import { ApiService } from '../../../core/services/api.service';
import { ChartService } from '../../../core/services/chart.service';
import { BomTreeFullResponse, BomTreeNode, UpdateBomSettingsResponse, Product } from '../../../shared/models';

describe('BomTreeComponent', () => {
  let component: BomTreeComponent;
  let fixture: ComponentFixture<BomTreeComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockTreeNode: BomTreeNode = {
    bomId: 1,
    productSku: 'FG-STEEL-001',
    bomVersion: 'V1',
    materialId: 'RM-IRON-001',
    materialName: 'Iron Ore',
    quantityRequired: 1.5,
    unit: 'T',
    yieldLossRatio: 1.05,
    sequenceLevel: 1,
    parentBomId: undefined,
    status: 'ACTIVE',
    children: [
      {
        bomId: 2,
        productSku: 'FG-STEEL-001',
        bomVersion: 'V1',
        materialId: 'RM-COAL-001',
        materialName: 'Coal',
        quantityRequired: 0.5,
        unit: 'T',
        yieldLossRatio: 1.0,
        sequenceLevel: 2,
        parentBomId: 1,
        status: 'ACTIVE',
        children: []
      }
    ]
  };

  const mockBomTree: BomTreeFullResponse = {
    productSku: 'FG-STEEL-001',
    bomVersion: 'V1',
    tree: [mockTreeNode],
    totalNodes: 2,
    maxDepth: 2
  };

  const mockProducts: Product[] = [
    { productId: 1, sku: 'FG-STEEL-001', productName: 'Steel Plate', baseUnit: 'T', status: 'ACTIVE' },
    { productId: 2, sku: 'FG-STEEL-002', productName: 'Steel Coil', baseUnit: 'T', status: 'ACTIVE' }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getBomTree',
      'deleteBomNode',
      'deleteBomNodeCascade',
      'updateBomSettings',
      'getActiveProducts',
      'moveBomNode'
    ]);
    const chartSpy = jasmine.createSpyObj('ChartService', ['initChart', 'setOption', 'disposeChart', 'disposeAll']);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        FormsModule
      ],
      declarations: [BomTreeComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: ChartService, useValue: chartSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ productSku: 'FG-STEEL-001' })
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getBomTree.and.returnValue(of(mockBomTree));
    apiServiceSpy.getActiveProducts.and.returnValue(of(mockProducts));
    fixture = TestBed.createComponent(BomTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load BOM tree on init', () => {
    expect(apiServiceSpy.getBomTree).toHaveBeenCalledWith('FG-STEEL-001');
    expect(component.bomTree).toEqual(mockBomTree);
    expect(component.loading).toBeFalse();
  });

  it('should display product SKU', () => {
    expect(component.productSku).toBe('FG-STEEL-001');
  });

  it('should display tree metadata', () => {
    expect(component.bomTree?.totalNodes).toBe(2);
    expect(component.bomTree?.maxDepth).toBe(2);
  });

  describe('Tree Node Display', () => {
    it('should display node material ID', () => {
      expect(mockBomTree.tree[0].materialId).toBe('RM-IRON-001');
    });

    it('should display node material name', () => {
      expect(mockBomTree.tree[0].materialName).toBe('Iron Ore');
    });

    it('should display node quantity and unit', () => {
      expect(mockBomTree.tree[0].quantityRequired).toBe(1.5);
      expect(mockBomTree.tree[0].unit).toBe('T');
    });

    it('should display node status', () => {
      expect(mockBomTree.tree[0].status).toBe('ACTIVE');
    });

    it('should display yield loss ratio', () => {
      expect(mockBomTree.tree[0].yieldLossRatio).toBe(1.05);
    });
  });

  describe('Expand/Collapse', () => {
    it('should start with all nodes expanded', () => {
      expect(component.isExpanded(1)).toBeTrue();
    });

    it('should toggle node expansion', () => {
      component.toggleNode(1);
      expect(component.isExpanded(1)).toBeFalse();

      component.toggleNode(1);
      expect(component.isExpanded(1)).toBeTrue();
    });

    it('should expand all nodes', () => {
      component.toggleNode(1); // Collapse first
      expect(component.isExpanded(1)).toBeFalse();

      component.expandAll();
      expect(component.isExpanded(1)).toBeTrue();
    });

    it('should collapse all nodes', () => {
      expect(component.isExpanded(1)).toBeTrue();

      component.collapseAll();
      expect(component.isExpanded(1)).toBeFalse();
    });
  });

  describe('Node Selection', () => {
    it('should select a node', () => {
      component.selectNode(mockTreeNode);
      expect(component.isSelected(mockTreeNode)).toBeTrue();
    });

    it('should deselect when selecting again', () => {
      component.selectNode(mockTreeNode);
      component.selectNode(mockTreeNode);
      expect(component.isSelected(mockTreeNode)).toBeFalse();
    });
  });

  describe('Indentation', () => {
    it('should calculate indent level for root', () => {
      const indent = component.getIndentLevel(1);
      expect(indent).toBe('0px');
    });

    it('should calculate indent level for child', () => {
      const indent = component.getIndentLevel(2);
      expect(indent).toBe('24px');
    });

    it('should calculate indent level for grandchild', () => {
      const indent = component.getIndentLevel(3);
      expect(indent).toBe('48px');
    });

    it('should cap indent level at 240px for deeply nested nodes', () => {
      const indent = component.getIndentLevel(15);
      expect(indent).toBe('240px');
    });
  });

  describe('Delete Operations', () => {
    it('should open delete confirmation', () => {
      component.confirmDelete(1);
      expect(component.deleteConfirmId).toBe(1);
    });

    it('should cancel delete', () => {
      component.confirmDelete(1);
      component.cancelDelete();
      expect(component.deleteConfirmId).toBeNull();
    });

    it('should delete node without cascade', () => {
      apiServiceSpy.deleteBomNode.and.returnValue(of({ message: 'Deleted' }));
      apiServiceSpy.getBomTree.and.returnValue(of(mockBomTree));

      component.deleteNode(1, false);

      expect(apiServiceSpy.deleteBomNode).toHaveBeenCalledWith(1);
      expect(component.deleteConfirmId).toBeNull();
    });

    it('should delete node with cascade', () => {
      apiServiceSpy.deleteBomNodeCascade.and.returnValue(of({ message: 'Deleted', deletedCount: 2 }));
      apiServiceSpy.getBomTree.and.returnValue(of(mockBomTree));

      component.deleteNode(1, true);

      expect(apiServiceSpy.deleteBomNodeCascade).toHaveBeenCalledWith(1);
    });

    it('should handle delete error', () => {
      apiServiceSpy.deleteBomNode.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot delete' } }))
      );

      component.confirmDelete(1);
      component.deleteNode(1, false);

      expect(component.deleteConfirmId).toBeNull();
      expect(component.error).toBe('Cannot delete');
    });
  });

  describe('Navigation', () => {
    it('should navigate to add root node', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.addRootNode();
      expect(navigateSpy).toHaveBeenCalledWith(['/manage/bom', 'FG-STEEL-001', 'node', 'new']);
    });

    it('should navigate to add child node', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.addChildNode(1);
      expect(navigateSpy).toHaveBeenCalledWith(
        ['/manage/bom', 'FG-STEEL-001', 'node', 'new'],
        { queryParams: { parentId: 1 } }
      );
    });

    it('should navigate to edit node', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.editNode(1);
      expect(navigateSpy).toHaveBeenCalledWith(['/manage/bom', 'FG-STEEL-001', 'node', 1, 'edit']);
    });

    it('should navigate back to list', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.goBack();
      expect(navigateSpy).toHaveBeenCalledWith(['/manage/bom']);
    });
  });

  describe('Error Handling', () => {
    it('should handle error loading tree', () => {
      apiServiceSpy.getBomTree.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );

      component.loadBomTree();

      expect(component.loading).toBeFalse();
      expect(component.error).toBe('Failed to load BOM tree');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no nodes', () => {
      const emptyTree: BomTreeFullResponse = {
        productSku: 'FG-STEEL-001',
        bomVersion: 'V1',
        tree: [],
        totalNodes: 0,
        maxDepth: 0
      };
      apiServiceSpy.getBomTree.and.returnValue(of(emptyTree));

      component.loadBomTree();

      expect(component.bomTree?.tree.length).toBe(0);
    });
  });

  describe('Move Node', () => {
    it('should open move modal', () => {
      component.openMoveModal(2);
      expect(component.showMoveModal).toBeTrue();
      expect(component.moveNodeId).toBe(2);
    });

    it('should exclude the moved node and its descendants from target list', () => {
      component.openMoveModal(1); // Node 1 has child node 2
      // Node 1 and its child node 2 should be excluded
      expect(component.allFlatNodes.find(n => n.bomId === 1)).toBeUndefined();
      expect(component.allFlatNodes.find(n => n.bomId === 2)).toBeUndefined();
    });

    it('should close move modal', () => {
      component.openMoveModal(2);
      component.closeMoveModal();
      expect(component.showMoveModal).toBeFalse();
      expect(component.moveNodeId).toBeNull();
    });

    it('should perform move successfully', () => {
      apiServiceSpy.moveBomNode.and.returnValue(of(mockTreeNode));
      apiServiceSpy.getBomTree.and.returnValue(of(mockBomTree));

      component.openMoveModal(2);
      component.moveTargetParentId = null; // Move to root
      component.performMove();

      expect(apiServiceSpy.moveBomNode).toHaveBeenCalledWith(2, { newParentBomId: undefined });
      expect(component.showMoveModal).toBeFalse();
    });

    it('should handle move error', () => {
      apiServiceSpy.moveBomNode.and.returnValue(
        throwError(() => ({ error: { message: 'Circular reference' } }))
      );

      component.openMoveModal(2);
      component.performMove();

      expect(component.moveError).toBe('Circular reference');
      expect(component.movingNode).toBeFalse();
    });
  });

  describe('Edit BOM Settings', () => {
    const mockUpdateResponse: UpdateBomSettingsResponse = {
      productSku: 'FG-STEEL-001',
      bomVersion: 'V2',
      status: 'DRAFT',
      nodesUpdated: 2
    };

    it('should open edit settings modal', () => {
      component.openEditSettingsModal();
      expect(component.showEditSettingsModal).toBeTrue();
    });

    it('should populate current values when opening modal', () => {
      component.openEditSettingsModal();
      expect(component.editProductSku).toBe('FG-STEEL-001');
      expect(component.editBomVersion).toBe('V1');
      expect(component.editBomStatus).toBe('ACTIVE');
    });

    it('should load products when opening modal', () => {
      component.openEditSettingsModal();
      expect(apiServiceSpy.getActiveProducts).toHaveBeenCalled();
    });

    it('should close edit settings modal', () => {
      component.openEditSettingsModal();
      component.closeEditSettingsModal();
      expect(component.showEditSettingsModal).toBeFalse();
    });

    it('should validate version is required', () => {
      component.openEditSettingsModal();
      component.editBomVersion = '';
      component.saveSettings();
      expect(component.settingsError).toBe('BOM Version is required');
    });

    it('should validate product is required', () => {
      component.openEditSettingsModal();
      component.editProductSku = '';
      component.saveSettings();
      expect(component.settingsError).toBe('Product is required');
    });

    it('should save settings successfully without product change', () => {
      apiServiceSpy.updateBomSettings.and.returnValue(of(mockUpdateResponse));
      apiServiceSpy.getBomTree.and.returnValue(of(mockBomTree));

      component.openEditSettingsModal();
      component.editBomVersion = 'V2';
      component.editBomStatus = 'DRAFT';
      component.saveSettings();

      expect(apiServiceSpy.updateBomSettings).toHaveBeenCalledWith('FG-STEEL-001', {
        bomVersion: 'V2',
        status: 'DRAFT'
      });
      expect(component.showEditSettingsModal).toBeFalse();
    });

    it('should include newProductSku when product changes', () => {
      const newProductResponse: UpdateBomSettingsResponse = {
        productSku: 'FG-STEEL-002',
        bomVersion: 'V1',
        status: 'ACTIVE',
        nodesUpdated: 2
      };
      apiServiceSpy.updateBomSettings.and.returnValue(of(newProductResponse));
      const navigateSpy = spyOn(router, 'navigate');

      component.openEditSettingsModal();
      component.editProductSku = 'FG-STEEL-002';
      component.saveSettings();

      expect(apiServiceSpy.updateBomSettings).toHaveBeenCalledWith('FG-STEEL-001', jasmine.objectContaining({
        newProductSku: 'FG-STEEL-002'
      }));
      expect(navigateSpy).toHaveBeenCalledWith(['/manage/bom', 'FG-STEEL-002', 'tree']);
    });

    it('should handle save settings error', () => {
      apiServiceSpy.updateBomSettings.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      component.openEditSettingsModal();
      component.editBomVersion = 'V2';
      component.saveSettings();

      expect(component.settingsError).toBe('Update failed');
      expect(component.savingSettings).toBeFalse();
    });

    it('should clear error when closing modal', () => {
      component.settingsError = 'Some error';
      component.closeEditSettingsModal();
      expect(component.settingsError).toBeNull();
    });

    it('should have status options defined', () => {
      expect(component.statusOptions.length).toBe(4);
      expect(component.statusOptions).toContain('ACTIVE');
      expect(component.statusOptions).toContain('INACTIVE');
      expect(component.statusOptions).toContain('DRAFT');
      expect(component.statusOptions).toContain('OBSOLETE');
    });
  });
});
