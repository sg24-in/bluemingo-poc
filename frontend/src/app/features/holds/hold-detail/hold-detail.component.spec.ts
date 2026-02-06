import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { HoldDetailComponent } from './hold-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('HoldDetailComponent', () => {
  let component: HoldDetailComponent;
  let fixture: ComponentFixture<HoldDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockHold = {
    holdId: 1,
    entityType: 'ORDER' as const,
    entityId: 100,
    reason: 'Quality Issue',
    appliedBy: 'admin',
    appliedOn: new Date().toISOString(),
    status: 'ACTIVE' as const
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getHoldById',
      'releaseHold'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [HoldDetailComponent],
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
    apiServiceSpy.getHoldById.and.returnValue(of(mockHold));
    fixture = TestBed.createComponent(HoldDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load hold on init', () => {
    expect(apiServiceSpy.getHoldById).toHaveBeenCalledWith(1);
    expect(component.hold).toEqual(mockHold);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing hold ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getHoldById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [HoldDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HoldDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No hold ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading hold', () => {
    apiServiceSpy.getHoldById.and.returnValue(throwError(() => new Error('Error')));

    component.loadHold(1);

    expect(component.error).toBe('Failed to load hold');
    expect(component.loading).toBeFalse();
  });

  it('should navigate back to holds list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/holds']);
  });

  it('should return correct status class for ACTIVE', () => {
    expect(component.getStatusClass('ACTIVE')).toBe('status-active');
  });

  it('should return correct status class for RELEASED', () => {
    expect(component.getStatusClass('RELEASED')).toBe('status-released');
  });

  it('should return correct entity type label', () => {
    expect(component.getEntityTypeLabel('ORDER')).toBe('Order');
    expect(component.getEntityTypeLabel('BATCH')).toBe('Batch');
    expect(component.getEntityTypeLabel('INVENTORY')).toBe('Inventory');
    expect(component.getEntityTypeLabel('EQUIPMENT')).toBe('Equipment');
  });

  it('should return correct entity type class', () => {
    expect(component.getEntityTypeClass('ORDER')).toBe('entity-order');
    expect(component.getEntityTypeClass('BATCH')).toBe('entity-batch');
    expect(component.getEntityTypeClass('INVENTORY')).toBe('entity-inventory');
    expect(component.getEntityTypeClass('EQUIPMENT')).toBe('entity-equipment');
  });

  it('should navigate to order entity', () => {
    spyOn(router, 'navigate');
    component.navigateToEntity();
    expect(router.navigate).toHaveBeenCalledWith(['/orders', 100]);
  });

  it('should navigate to batch entity', () => {
    component.hold = { ...mockHold, entityType: 'BATCH', entityId: 200 };
    spyOn(router, 'navigate');
    component.navigateToEntity();
    expect(router.navigate).toHaveBeenCalledWith(['/batches', 200]);
  });

  it('should navigate to inventory entity', () => {
    component.hold = { ...mockHold, entityType: 'INVENTORY', entityId: 300 };
    spyOn(router, 'navigate');
    component.navigateToEntity();
    expect(router.navigate).toHaveBeenCalledWith(['/inventory', 300]);
  });

  it('should navigate to equipment entity', () => {
    component.hold = { ...mockHold, entityType: 'EQUIPMENT', entityId: 400 };
    spyOn(router, 'navigate');
    component.navigateToEntity();
    expect(router.navigate).toHaveBeenCalledWith(['/equipment', 400]);
  });

  it('should release hold', () => {
    spyOn(window, 'prompt').and.returnValue('Issue resolved');
    apiServiceSpy.releaseHold.and.returnValue(of({ ...mockHold, status: 'RELEASED' }));
    apiServiceSpy.getHoldById.and.returnValue(of({ ...mockHold, status: 'RELEASED' }));

    component.releaseHold();

    expect(apiServiceSpy.releaseHold).toHaveBeenCalledWith(1, 'Issue resolved');
  });

  it('should release hold with empty comments', () => {
    spyOn(window, 'prompt').and.returnValue('');
    apiServiceSpy.releaseHold.and.returnValue(of({ ...mockHold, status: 'RELEASED' }));
    apiServiceSpy.getHoldById.and.returnValue(of({ ...mockHold, status: 'RELEASED' }));

    component.releaseHold();

    expect(apiServiceSpy.releaseHold).toHaveBeenCalledWith(1, undefined);
  });

  it('should not release if already released', () => {
    component.hold = { ...mockHold, status: 'RELEASED' };

    component.releaseHold();

    expect(apiServiceSpy.releaseHold).not.toHaveBeenCalled();
  });

  it('should handle release error', () => {
    spyOn(window, 'prompt').and.returnValue('Comments');
    apiServiceSpy.releaseHold.and.returnValue(throwError(() => new Error('Error')));

    component.releaseHold();

    expect(component.error).toBe('Failed to release hold');
    expect(component.releasing).toBeFalse();
  });

  it('should format duration correctly for minutes', () => {
    expect(component.formatDuration(30)).toBe('30 min');
  });

  it('should format duration correctly for hours', () => {
    expect(component.formatDuration(90)).toBe('1h 30m');
  });

  it('should format duration correctly for days', () => {
    expect(component.formatDuration(1500)).toBe('1d 1h');
  });

  it('should return dash for undefined duration', () => {
    expect(component.formatDuration(undefined)).toBe('-');
  });
});
