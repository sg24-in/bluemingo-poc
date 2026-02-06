import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { InventoryDetailComponent } from './inventory-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('InventoryDetailComponent', () => {
  let component: InventoryDetailComponent;
  let fixture: ComponentFixture<InventoryDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockInventory = {
    inventoryId: 1,
    materialId: 'MAT-001',
    materialName: 'Test Material',
    inventoryType: 'RM',
    batchId: 10,
    batchNumber: 'BATCH-001',
    quantity: 100,
    unit: 'KG',
    state: 'AVAILABLE' as const,
    location: 'Warehouse A'
  };

  const mockStateResponse = {
    inventoryId: 1,
    previousState: 'AVAILABLE',
    newState: 'BLOCKED',
    message: 'Inventory state updated successfully',
    updatedBy: 'admin',
    updatedOn: new Date().toISOString()
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getInventoryById',
      'blockInventory',
      'unblockInventory',
      'scrapInventory'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [InventoryDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getInventoryById.and.returnValue(of(mockInventory));
    fixture = TestBed.createComponent(InventoryDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load inventory on init', () => {
    expect(apiServiceSpy.getInventoryById).toHaveBeenCalledWith(1);
    expect(component.inventory).toEqual(mockInventory);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing inventory ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getInventoryById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [InventoryDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No inventory ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading inventory', () => {
    apiServiceSpy.getInventoryById.and.returnValue(throwError(() => new Error('Error')));

    component.loadInventory(1);

    expect(component.error).toBe('Failed to load inventory');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to edit inventory', () => {
    spyOn(router, 'navigate');
    component.editInventory();
    expect(router.navigate).toHaveBeenCalledWith(['/inventory', 1, 'edit']);
  });

  it('should navigate to view batch', () => {
    spyOn(router, 'navigate');
    component.viewBatch();
    expect(router.navigate).toHaveBeenCalledWith(['/batches', 10]);
  });

  it('should navigate back to inventory list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/inventory']);
  });

  it('should return correct state class for AVAILABLE', () => {
    expect(component.getStateClass('AVAILABLE')).toBe('state-available');
  });

  it('should return correct state class for CONSUMED', () => {
    expect(component.getStateClass('CONSUMED')).toBe('state-consumed');
  });

  it('should return correct state class for BLOCKED', () => {
    expect(component.getStateClass('BLOCKED')).toBe('state-blocked');
  });

  it('should return correct state class for SCRAPPED', () => {
    expect(component.getStateClass('SCRAPPED')).toBe('state-scrapped');
  });

  it('should return correct type label for RM', () => {
    expect(component.getTypeLabel('RM')).toBe('Raw Material');
  });

  it('should return correct type label for FG', () => {
    expect(component.getTypeLabel('FG')).toBe('Finished Goods');
  });

  it('should return correct type class for RM', () => {
    expect(component.getTypeClass('RM')).toBe('type-rm');
  });

  it('should return correct type class for FG', () => {
    expect(component.getTypeClass('FG')).toBe('type-fg');
  });

  it('should block inventory', () => {
    spyOn(window, 'prompt').and.returnValue('Quality hold');
    apiServiceSpy.blockInventory.and.returnValue(of(mockStateResponse));
    apiServiceSpy.getInventoryById.and.returnValue(of({ ...mockInventory, state: 'BLOCKED' as const }));

    component.blockInventory();

    expect(apiServiceSpy.blockInventory).toHaveBeenCalledWith(1, 'Quality hold');
  });

  it('should not block if no reason provided', () => {
    spyOn(window, 'prompt').and.returnValue(null);

    component.blockInventory();

    expect(apiServiceSpy.blockInventory).not.toHaveBeenCalled();
  });

  it('should unblock inventory', () => {
    component.inventory = { ...mockInventory, state: 'BLOCKED' as const } as any;
    apiServiceSpy.unblockInventory.and.returnValue(of({ ...mockStateResponse, newState: 'AVAILABLE' }));

    component.unblockInventory();

    expect(apiServiceSpy.unblockInventory).toHaveBeenCalledWith(1);
  });

  it('should scrap inventory', () => {
    spyOn(window, 'prompt').and.returnValue('Damaged');
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.scrapInventory.and.returnValue(of({ ...mockStateResponse, newState: 'SCRAPPED' }));
    apiServiceSpy.getInventoryById.and.returnValue(of({ ...mockInventory, state: 'SCRAPPED' as const }));

    component.scrapInventory();

    expect(apiServiceSpy.scrapInventory).toHaveBeenCalledWith(1, 'Damaged');
  });

  it('should not scrap if no reason provided', () => {
    spyOn(window, 'prompt').and.returnValue(null);

    component.scrapInventory();

    expect(apiServiceSpy.scrapInventory).not.toHaveBeenCalled();
  });

  it('should not scrap if user cancels confirmation', () => {
    spyOn(window, 'prompt').and.returnValue('Damaged');
    spyOn(window, 'confirm').and.returnValue(false);

    component.scrapInventory();

    expect(apiServiceSpy.scrapInventory).not.toHaveBeenCalled();
  });

  it('should handle block error', () => {
    spyOn(window, 'prompt').and.returnValue('Reason');
    apiServiceSpy.blockInventory.and.returnValue(throwError(() => new Error('Error')));

    component.blockInventory();

    expect(component.error).toBe('Failed to block inventory');
  });

  it('should handle unblock error', () => {
    apiServiceSpy.unblockInventory.and.returnValue(throwError(() => new Error('Error')));

    component.unblockInventory();

    expect(component.error).toBe('Failed to unblock inventory');
  });

  it('should handle scrap error', () => {
    spyOn(window, 'prompt').and.returnValue('Reason');
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.scrapInventory.and.returnValue(throwError(() => new Error('Error')));

    component.scrapInventory();

    expect(component.error).toBe('Failed to scrap inventory');
  });
});
