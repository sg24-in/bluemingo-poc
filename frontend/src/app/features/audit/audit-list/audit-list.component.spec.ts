import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { AuditListComponent } from './audit-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('AuditListComponent', () => {
  let component: AuditListComponent;
  let fixture: ComponentFixture<AuditListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockEntries: any[] = [
    {
      auditId: 1,
      entityType: 'ORDER',
      entityId: 10,
      fieldName: 'status',
      oldValue: 'CREATED',
      newValue: 'IN_PROGRESS',
      action: 'STATUS_CHANGE',
      changedBy: 'admin',
      timestamp: '2024-01-15T10:30:00'
    },
    {
      auditId: 2,
      entityType: 'BATCH',
      entityId: 20,
      fieldName: null,
      oldValue: null,
      newValue: 'BATCH-001',
      action: 'CREATE',
      changedBy: 'admin',
      timestamp: '2024-01-15T11:00:00'
    },
    {
      auditId: 3,
      entityType: 'INVENTORY',
      entityId: 30,
      fieldName: 'state',
      oldValue: 'AVAILABLE',
      newValue: 'BLOCKED',
      action: 'HOLD',
      changedBy: 'operator1',
      timestamp: '2024-01-15T12:00:00'
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getRecentAuditActivity',
      'getAuditEntityTypes',
      'getAuditActionTypes',
      'getAuditSummary'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [AuditListComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getRecentAuditActivity.and.returnValue(of(mockEntries));
    apiServiceSpy.getAuditEntityTypes.and.returnValue(of(['ORDER', 'BATCH', 'INVENTORY', 'OPERATION']));
    apiServiceSpy.getAuditActionTypes.and.returnValue(of(['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'HOLD', 'RELEASE']));
    apiServiceSpy.getAuditSummary.and.returnValue(of({ todaysActivityCount: 42, recentActivity: [] }));

    fixture = TestBed.createComponent(AuditListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load audit entries on init', () => {
    expect(apiServiceSpy.getRecentAuditActivity).toHaveBeenCalledWith(200);
    expect(component.entries.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should load entity types and action types', () => {
    expect(component.entityTypes.length).toBe(4);
    expect(component.actionTypes.length).toBe(6);
  });

  it('should load todays count from summary', () => {
    expect(component.todaysCount).toBe(42);
  });

  it('should filter by entity type', () => {
    component.filterEntityType = 'ORDER';
    expect(component.filteredEntries.length).toBe(1);
    expect(component.filteredEntries[0].entityType).toBe('ORDER');
  });

  it('should filter by action type', () => {
    component.filterAction = 'CREATE';
    expect(component.filteredEntries.length).toBe(1);
    expect(component.filteredEntries[0].action).toBe('CREATE');
  });

  it('should filter by user', () => {
    component.filterUser = 'operator';
    expect(component.filteredEntries.length).toBe(1);
    expect(component.filteredEntries[0].changedBy).toBe('operator1');
  });

  it('should combine filters', () => {
    component.filterEntityType = 'INVENTORY';
    component.filterAction = 'HOLD';
    expect(component.filteredEntries.length).toBe(1);
  });

  it('should show all when no filters', () => {
    expect(component.filteredEntries.length).toBe(3);
  });

  it('should clear filters', () => {
    component.filterEntityType = 'ORDER';
    component.filterAction = 'CREATE';
    component.filterUser = 'test';
    component.clearFilters();
    expect(component.filterEntityType).toBe('all');
    expect(component.filterAction).toBe('all');
    expect(component.filterUser).toBe('');
  });

  it('should return correct action class', () => {
    expect(component.getActionClass('CREATE')).toBe('action-create');
    expect(component.getActionClass('UPDATE')).toBe('action-update');
    expect(component.getActionClass('DELETE')).toBe('action-delete');
    expect(component.getActionClass('STATUS_CHANGE')).toBe('action-status');
    expect(component.getActionClass('HOLD')).toBe('action-hold');
    expect(component.getActionClass('RELEASE')).toBe('action-release');
  });

  it('should return correct action icon', () => {
    expect(component.getActionIcon('CREATE')).toBe('circle-plus');
    expect(component.getActionIcon('DELETE')).toBe('trash');
  });

  it('should format entity type', () => {
    expect(component.formatEntityType('ORDER_LINE')).toBe('ORDER LINE');
    expect(component.formatEntityType('PRODUCTION_CONFIRMATION')).toBe('PRODUCTION CONFIRMATION');
  });

  it('should toggle selected entry', () => {
    component.selectEntry(mockEntries[0]);
    expect(component.selectedEntry).toEqual(mockEntries[0]);

    component.selectEntry(mockEntries[0]);
    expect(component.selectedEntry).toBeNull();
  });

  it('should handle load error', () => {
    apiServiceSpy.getRecentAuditActivity.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));
    component.loadRecent();
    expect(component.error).toBe('Error');
    expect(component.loading).toBeFalse();
  });
});
