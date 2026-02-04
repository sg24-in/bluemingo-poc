import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { InventoryListComponent } from './inventory-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('InventoryListComponent', () => {
  let component: InventoryListComponent;
  let fixture: ComponentFixture<InventoryListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockInventory = [
    {
      inventoryId: 1,
      materialId: 'RM-001',
      materialName: 'Iron Ore',
      inventoryType: 'RM',
      state: 'AVAILABLE',
      quantity: 100,
      unit: 'KG',
      batchNumber: 'BATCH-001'
    },
    {
      inventoryId: 2,
      materialId: 'IM-001',
      materialName: 'Steel Billet',
      inventoryType: 'IM',
      state: 'CONSUMED',
      quantity: 50,
      unit: 'KG',
      batchNumber: 'BATCH-002'
    },
    {
      inventoryId: 3,
      materialId: 'FG-001',
      materialName: 'Steel Rod',
      inventoryType: 'FG',
      state: 'AVAILABLE',
      quantity: 200,
      unit: 'KG',
      batchNumber: 'BATCH-003'
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getAllInventory',
      'blockInventory',
      'unblockInventory',
      'scrapInventory'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        SharedModule
      ],
      declarations: [InventoryListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getAllInventory.and.returnValue(of(mockInventory as any));
    fixture = TestBed.createComponent(InventoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load inventory on init', () => {
    expect(apiServiceSpy.getAllInventory).toHaveBeenCalled();
    expect(component.inventory.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  describe('Filtering', () => {
    it('should filter by state', () => {
      component.onFilterStateChange('AVAILABLE');
      expect(component.filteredInventory.length).toBe(2);
      expect(component.filteredInventory.every(i => i.state === 'AVAILABLE')).toBeTrue();
    });

    it('should filter by type', () => {
      component.onFilterTypeChange('RM');
      expect(component.filteredInventory.length).toBe(1);
      expect(component.filteredInventory[0].inventoryType).toBe('RM');
    });

    it('should filter by search term (batch number)', () => {
      component.onSearchChange('BATCH-001');
      expect(component.filteredInventory.length).toBe(1);
      expect(component.filteredInventory[0].batchNumber).toBe('BATCH-001');
    });

    it('should filter by search term (material ID)', () => {
      component.onSearchChange('RM-001');
      expect(component.filteredInventory.length).toBe(1);
      expect(component.filteredInventory[0].materialId).toBe('RM-001');
    });

    it('should combine multiple filters', () => {
      component.filterState = 'AVAILABLE';
      component.filterType = 'FG';
      component.applyFilters();
      expect(component.filteredInventory.length).toBe(1);
      expect(component.filteredInventory[0].materialId).toBe('FG-001');
    });

    it('should show all when filter is all', () => {
      component.filterState = 'all';
      component.filterType = 'all';
      component.searchTerm = '';
      component.applyFilters();
      expect(component.filteredInventory.length).toBe(3);
    });
  });

  describe('Summary Methods', () => {
    it('should get state summary', () => {
      const summary = component.getStateSummary();
      expect(summary.length).toBe(2);

      const available = summary.find(s => s.state === 'AVAILABLE');
      expect(available?.count).toBe(2);

      const consumed = summary.find(s => s.state === 'CONSUMED');
      expect(consumed?.count).toBe(1);
    });

    it('should get type summary', () => {
      const summary = component.getTypeSummary();
      expect(summary.length).toBe(3);

      const rm = summary.find(s => s.type === 'RM');
      expect(rm?.count).toBe(1);
    });
  });

  it('should handle error loading inventory', () => {
    apiServiceSpy.getAllInventory.and.returnValue(throwError(() => new Error('Error')));

    component.loadInventory();

    expect(component.loading).toBeFalse();
  });

  it('should handle case-insensitive search', () => {
    component.onSearchChange('batch-001');
    expect(component.filteredInventory.length).toBe(1);
  });

  it('should handle empty search term', () => {
    component.onSearchChange('');
    expect(component.filteredInventory.length).toBe(3);
  });

  describe('Block Inventory', () => {
    it('should open block modal', () => {
      const item = mockInventory[0];
      component.openBlockModal(item);

      expect(component.showBlockModal).toBeTrue();
      expect(component.selectedInventory).toBe(item);
      expect(component.actionReason).toBe('');
    });

    it('should close block modal', () => {
      component.openBlockModal(mockInventory[0]);
      component.closeBlockModal();

      expect(component.showBlockModal).toBeFalse();
      expect(component.selectedInventory).toBeNull();
    });

    it('should show error when blocking without reason', () => {
      component.openBlockModal(mockInventory[0]);
      component.actionReason = '';
      component.confirmBlock();

      expect(component.actionError).toBe('Please provide a reason for blocking.');
    });

    it('should block inventory successfully', () => {
      const mockResponse = { inventoryId: 1, previousState: 'AVAILABLE', newState: 'BLOCKED' } as any;
      apiServiceSpy.blockInventory.and.returnValue(of(mockResponse));

      component.openBlockModal(mockInventory[0]);
      component.actionReason = 'Quality issue';
      component.confirmBlock();

      expect(apiServiceSpy.blockInventory).toHaveBeenCalledWith(1, 'Quality issue');
      expect(component.showBlockModal).toBeFalse();
    });

    it('should handle block error', () => {
      apiServiceSpy.blockInventory.and.returnValue(throwError(() => ({ error: { message: 'Block failed' } })));

      component.openBlockModal(mockInventory[0]);
      component.actionReason = 'Quality issue';
      component.confirmBlock();

      expect(component.actionError).toBe('Block failed');
    });

    it('should determine if item can be blocked', () => {
      expect(component.canBlock({ state: 'AVAILABLE' })).toBeTrue();
      expect(component.canBlock({ state: 'BLOCKED' })).toBeFalse();
      expect(component.canBlock({ state: 'CONSUMED' })).toBeFalse();
      expect(component.canBlock({ state: 'SCRAPPED' })).toBeFalse();
    });
  });

  describe('Unblock Inventory', () => {
    it('should unblock inventory successfully', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const mockResponse = { inventoryId: 1, previousState: 'BLOCKED', newState: 'AVAILABLE' } as any;
      apiServiceSpy.unblockInventory.and.returnValue(of(mockResponse));

      const blockedItem = { inventoryId: 1, batchNumber: 'BATCH-001', state: 'BLOCKED' };
      component.unblockInventory(blockedItem);

      expect(apiServiceSpy.unblockInventory).toHaveBeenCalledWith(1);
    });

    it('should not unblock if user cancels confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      const blockedItem = { inventoryId: 1, batchNumber: 'BATCH-001', state: 'BLOCKED' };
      component.unblockInventory(blockedItem);

      expect(apiServiceSpy.unblockInventory).not.toHaveBeenCalled();
    });

    it('should determine if item can be unblocked', () => {
      expect(component.canUnblock({ state: 'BLOCKED' })).toBeTrue();
      expect(component.canUnblock({ state: 'AVAILABLE' })).toBeFalse();
    });
  });

  describe('Scrap Inventory', () => {
    it('should open scrap modal', () => {
      const item = mockInventory[0];
      component.openScrapModal(item);

      expect(component.showScrapModal).toBeTrue();
      expect(component.selectedInventory).toBe(item);
    });

    it('should close scrap modal', () => {
      component.openScrapModal(mockInventory[0]);
      component.closeScrapModal();

      expect(component.showScrapModal).toBeFalse();
      expect(component.selectedInventory).toBeNull();
    });

    it('should show error when scrapping without reason', () => {
      component.openScrapModal(mockInventory[0]);
      component.actionReason = '';
      component.confirmScrap();

      expect(component.actionError).toBe('Please provide a reason for scrapping.');
    });

    it('should scrap inventory successfully', () => {
      const mockResponse = { inventoryId: 1, previousState: 'AVAILABLE', newState: 'SCRAPPED' } as any;
      apiServiceSpy.scrapInventory.and.returnValue(of(mockResponse));

      component.openScrapModal(mockInventory[0]);
      component.actionReason = 'Damaged';
      component.confirmScrap();

      expect(apiServiceSpy.scrapInventory).toHaveBeenCalledWith(1, 'Damaged');
      expect(component.showScrapModal).toBeFalse();
    });

    it('should determine if item can be scrapped', () => {
      expect(component.canScrap({ state: 'AVAILABLE' })).toBeTrue();
      expect(component.canScrap({ state: 'BLOCKED' })).toBeTrue();
      expect(component.canScrap({ state: 'CONSUMED' })).toBeFalse();
      expect(component.canScrap({ state: 'SCRAPPED' })).toBeFalse();
    });
  });
});
