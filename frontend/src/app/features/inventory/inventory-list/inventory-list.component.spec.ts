import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { InventoryListComponent } from './inventory-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { PagedResponse } from '../../../shared/models/pagination.model';
import { Inventory } from '../../../shared/models';

describe('InventoryListComponent', () => {
  let component: InventoryListComponent;
  let fixture: ComponentFixture<InventoryListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let queryParamsSubject: BehaviorSubject<any>;

  const mockInventory: Inventory[] = [
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

  const mockPagedResponse: PagedResponse<Inventory> = {
    content: mockInventory,
    page: 0,
    size: 20,
    totalElements: 3,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
    first: true,
    last: true
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getInventoryPaged',
      'blockInventory',
      'unblockInventory',
      'scrapInventory'
    ]);

    queryParamsSubject = new BehaviorSubject<any>({});

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        SharedModule
      ],
      declarations: [InventoryListComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getInventoryPaged.and.returnValue(of(mockPagedResponse));
    fixture = TestBed.createComponent(InventoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load inventory on init', () => {
    expect(apiServiceSpy.getInventoryPaged).toHaveBeenCalled();
    expect(component.inventory.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should set pagination state from response', () => {
    expect(component.page).toBe(0);
    expect(component.size).toBe(20);
    expect(component.totalElements).toBe(3);
    expect(component.totalPages).toBe(1);
    expect(component.hasNext).toBeFalse();
    expect(component.hasPrevious).toBeFalse();
  });

  describe('Filtering', () => {
    it('should reload inventory when state filter changes', () => {
      apiServiceSpy.getInventoryPaged.calls.reset();
      component.onFilterStateChange('AVAILABLE');
      expect(apiServiceSpy.getInventoryPaged).toHaveBeenCalled();
      expect(component.filterState).toBe('AVAILABLE');
      expect(component.page).toBe(0);
    });

    it('should clear state filter when selecting all', () => {
      component.onFilterStateChange('all');
      expect(component.filterState).toBe('');
    });

    it('should reload inventory when type filter changes', () => {
      apiServiceSpy.getInventoryPaged.calls.reset();
      component.onFilterTypeChange('RM');
      expect(apiServiceSpy.getInventoryPaged).toHaveBeenCalled();
      expect(component.filterType).toBe('RM');
      expect(component.page).toBe(0);
    });

    it('should clear type filter when selecting all', () => {
      component.onFilterTypeChange('all');
      expect(component.filterType).toBe('');
    });

    it('should reload inventory when search changes', () => {
      apiServiceSpy.getInventoryPaged.calls.reset();
      component.onSearchChange('BATCH-001');
      expect(apiServiceSpy.getInventoryPaged).toHaveBeenCalled();
      expect(component.searchTerm).toBe('BATCH-001');
      expect(component.page).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('should reload inventory when page changes', () => {
      // Mock response with new page
      const page1Response: PagedResponse<Inventory> = {
        ...mockPagedResponse,
        page: 1
      };
      apiServiceSpy.getInventoryPaged.and.returnValue(of(page1Response));
      apiServiceSpy.getInventoryPaged.calls.reset();

      component.onPageChange(1);
      expect(apiServiceSpy.getInventoryPaged).toHaveBeenCalled();
      expect(component.page).toBe(1);
    });

    it('should reload inventory and reset page when size changes', () => {
      // Mock response with new size
      const size50Response: PagedResponse<Inventory> = {
        ...mockPagedResponse,
        size: 50,
        page: 0
      };
      apiServiceSpy.getInventoryPaged.and.returnValue(of(size50Response));
      apiServiceSpy.getInventoryPaged.calls.reset();

      component.page = 2;
      component.onSizeChange(50);
      expect(apiServiceSpy.getInventoryPaged).toHaveBeenCalled();
      expect(component.size).toBe(50);
      expect(component.page).toBe(0);
    });
  });

  it('should handle error loading inventory', () => {
    apiServiceSpy.getInventoryPaged.and.returnValue(throwError(() => new Error('Error')));

    component.loadInventory();

    expect(component.loading).toBeFalse();
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
      expect(component.canBlock({ state: 'AVAILABLE' } as any)).toBeTrue();
      expect(component.canBlock({ state: 'BLOCKED' } as any)).toBeFalse();
      expect(component.canBlock({ state: 'CONSUMED' } as any)).toBeFalse();
      expect(component.canBlock({ state: 'SCRAPPED' } as any)).toBeFalse();
    });
  });

  describe('Unblock Inventory', () => {
    it('should unblock inventory successfully', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const mockResponse = { inventoryId: 1, previousState: 'BLOCKED', newState: 'AVAILABLE' } as any;
      apiServiceSpy.unblockInventory.and.returnValue(of(mockResponse));

      const blockedItem = { inventoryId: 1, batchNumber: 'BATCH-001', state: 'BLOCKED' } as any;
      component.unblockInventory(blockedItem);

      expect(apiServiceSpy.unblockInventory).toHaveBeenCalledWith(1);
    });

    it('should not unblock if user cancels confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      const blockedItem = { inventoryId: 1, batchNumber: 'BATCH-001', state: 'BLOCKED' } as any;
      component.unblockInventory(blockedItem);

      expect(apiServiceSpy.unblockInventory).not.toHaveBeenCalled();
    });

    it('should determine if item can be unblocked', () => {
      expect(component.canUnblock({ state: 'BLOCKED' } as any)).toBeTrue();
      expect(component.canUnblock({ state: 'AVAILABLE' } as any)).toBeFalse();
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
      expect(component.canScrap({ state: 'AVAILABLE' } as any)).toBeTrue();
      expect(component.canScrap({ state: 'BLOCKED' } as any)).toBeTrue();
      expect(component.canScrap({ state: 'CONSUMED' } as any)).toBeFalse();
      expect(component.canScrap({ state: 'SCRAPPED' } as any)).toBeFalse();
    });
  });

  describe('Query Params', () => {
    it('should set state filter from query params', () => {
      queryParamsSubject.next({ state: 'BLOCKED' });
      fixture.detectChanges();

      expect(component.filterState).toBe('BLOCKED');
    });

    it('should set type filter from query params', () => {
      queryParamsSubject.next({ type: 'RM' });
      fixture.detectChanges();

      expect(component.filterType).toBe('RM');
    });

    it('should set both state and type filters from query params', () => {
      queryParamsSubject.next({ state: 'AVAILABLE', type: 'FG' });
      fixture.detectChanges();

      expect(component.filterState).toBe('AVAILABLE');
      expect(component.filterType).toBe('FG');
    });

    it('should reload inventory when query params change', () => {
      apiServiceSpy.getInventoryPaged.calls.reset();
      queryParamsSubject.next({ state: 'BLOCKED' });
      fixture.detectChanges();

      expect(apiServiceSpy.getInventoryPaged).toHaveBeenCalled();
    });

    it('should handle empty query params', () => {
      queryParamsSubject.next({});
      fixture.detectChanges();

      expect(component.filterState).toBe('');
      expect(component.filterType).toBe('');
    });
  });

  describe('Filter Highlighting', () => {
    it('should apply filter-active class when state filter is set', () => {
      component.onFilterStateChange('BLOCKED');
      fixture.detectChanges();

      const stateFilterGroup = fixture.nativeElement.querySelector('.filter-group');
      expect(stateFilterGroup.classList.contains('filter-active')).toBeTrue();
    });

    it('should not apply filter-active class when state filter is empty', () => {
      component.onFilterStateChange('all');
      fixture.detectChanges();

      const stateFilterGroup = fixture.nativeElement.querySelector('.filter-group');
      expect(stateFilterGroup.classList.contains('filter-active')).toBeFalse();
    });

    it('should apply filter-active class to select element when type filter is set', () => {
      component.onFilterTypeChange('RM');
      fixture.detectChanges();

      const typeSelect = fixture.nativeElement.querySelectorAll('.filter-group select')[1];
      expect(typeSelect.classList.contains('filter-active')).toBeTrue();
    });

    it('should not apply filter-active class to select element when type filter is all', () => {
      component.onFilterTypeChange('all');
      fixture.detectChanges();

      const typeSelect = fixture.nativeElement.querySelectorAll('.filter-group select')[1];
      expect(typeSelect.classList.contains('filter-active')).toBeFalse();
    });

    it('should apply filter-active class to both filters when both are set', () => {
      queryParamsSubject.next({ state: 'AVAILABLE', type: 'FG' });
      fixture.detectChanges();

      const filterGroups = fixture.nativeElement.querySelectorAll('.filter-group');
      expect(filterGroups[0].classList.contains('filter-active')).toBeTrue();
      expect(filterGroups[1].classList.contains('filter-active')).toBeTrue();
    });
  });
});
