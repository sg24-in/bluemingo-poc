import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CustomerDetailComponent } from './customer-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('CustomerDetailComponent', () => {
  let component: CustomerDetailComponent;
  let fixture: ComponentFixture<CustomerDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockCustomer = {
    customerId: 1,
    customerCode: 'CUST-001',
    customerName: 'Test Customer',
    contactPerson: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    address: '123 Test St',
    status: 'ACTIVE' as const,
    createdOn: new Date().toISOString()
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getCustomerById',
      'deleteCustomer',
      'activateCustomer'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [CustomerDetailComponent],
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
    apiServiceSpy.getCustomerById.and.returnValue(of(mockCustomer));
    fixture = TestBed.createComponent(CustomerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load customer on init', () => {
    expect(apiServiceSpy.getCustomerById).toHaveBeenCalledWith(1);
    expect(component.customer).toEqual(mockCustomer);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing customer ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getCustomerById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [CustomerDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No customer ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading customer', () => {
    apiServiceSpy.getCustomerById.and.returnValue(throwError(() => new Error('Error')));

    component.loadCustomer(1);

    expect(component.error).toBe('Failed to load customer');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to edit customer', () => {
    spyOn(router, 'navigate');
    component.editCustomer();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/customers', 1, 'edit']);
  });

  it('should navigate back to customer list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/customers']);
  });

  it('should return correct status class for ACTIVE', () => {
    expect(component.getStatusClass('ACTIVE')).toBe('status-active');
  });

  it('should return correct status class for INACTIVE', () => {
    expect(component.getStatusClass('INACTIVE')).toBe('status-inactive');
  });

  it('should return empty string for unknown status', () => {
    expect(component.getStatusClass('UNKNOWN')).toBe('');
  });

  it('should deactivate active customer', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deleteCustomer.and.returnValue(of(void 0));
    apiServiceSpy.getCustomerById.and.returnValue(of({ ...mockCustomer, status: 'INACTIVE' }));

    component.toggleStatus();

    expect(apiServiceSpy.deleteCustomer).toHaveBeenCalledWith(1);
  });

  it('should not deactivate if user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.toggleStatus();

    expect(apiServiceSpy.deleteCustomer).not.toHaveBeenCalled();
  });

  it('should activate inactive customer', () => {
    component.customer = { ...mockCustomer, status: 'INACTIVE' };
    apiServiceSpy.activateCustomer.and.returnValue(of({ ...mockCustomer, status: 'ACTIVE' }));

    component.toggleStatus();

    expect(apiServiceSpy.activateCustomer).toHaveBeenCalledWith(1);
  });

  it('should handle deactivation error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deleteCustomer.and.returnValue(throwError(() => new Error('Error')));

    component.toggleStatus();

    expect(component.error).toBe('Failed to deactivate customer');
  });

  it('should handle activation error', () => {
    component.customer = { ...mockCustomer, status: 'INACTIVE' };
    apiServiceSpy.activateCustomer.and.returnValue(throwError(() => new Error('Error')));

    component.toggleStatus();

    expect(component.error).toBe('Failed to activate customer');
  });
});
