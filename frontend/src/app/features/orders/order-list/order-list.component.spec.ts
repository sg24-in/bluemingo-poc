import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OrderListComponent } from './order-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { PagedResponse } from '../../../shared/models/pagination.model';
import { Order } from '../../../shared/models';

describe('OrderListComponent', () => {
  let component: OrderListComponent;
  let fixture: ComponentFixture<OrderListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockOrders: Order[] = [
    {
      orderId: 1,
      orderNumber: 'ORD-001',
      status: 'IN_PROGRESS',
      lineItems: [{ orderLineId: 1, productSku: 'SKU-001', productName: 'Steel Rod', quantity: 100, unit: 'KG', status: 'IN_PROGRESS' }]
    },
    {
      orderId: 2,
      orderNumber: 'ORD-002',
      status: 'COMPLETED',
      lineItems: [{ orderLineId: 2, productSku: 'SKU-002', productName: 'Steel Plate', quantity: 50, unit: 'KG', status: 'COMPLETED' }]
    }
  ];

  const mockPagedResponse: PagedResponse<Order> = {
    content: mockOrders,
    page: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
    first: true,
    last: true
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getOrdersPaged']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [OrderListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getOrdersPaged.and.returnValue(of(mockPagedResponse));
    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load orders on init', () => {
    expect(apiServiceSpy.getOrdersPaged).toHaveBeenCalled();
    expect(component.orders.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should set pagination state from response', () => {
    expect(component.page).toBe(0);
    expect(component.size).toBe(20);
    expect(component.totalElements).toBe(2);
    expect(component.totalPages).toBe(1);
    expect(component.hasNext).toBeFalse();
    expect(component.hasPrevious).toBeFalse();
  });

  it('should reload orders when filter changes', () => {
    apiServiceSpy.getOrdersPaged.calls.reset();
    component.onFilterChange('IN_PROGRESS');
    expect(apiServiceSpy.getOrdersPaged).toHaveBeenCalled();
    expect(component.filterStatus).toBe('IN_PROGRESS');
    expect(component.page).toBe(0);
  });

  it('should clear filter when selecting all', () => {
    component.onFilterChange('all');
    expect(component.filterStatus).toBe('');
  });

  it('should reload orders when search changes', () => {
    apiServiceSpy.getOrdersPaged.calls.reset();
    component.onSearch('test');
    expect(apiServiceSpy.getOrdersPaged).toHaveBeenCalled();
    expect(component.searchTerm).toBe('test');
    expect(component.page).toBe(0);
  });

  it('should reload orders when page changes', () => {
    // Mock response with new page
    const page1Response: PagedResponse<Order> = {
      ...mockPagedResponse,
      page: 1
    };
    apiServiceSpy.getOrdersPaged.and.returnValue(of(page1Response));
    apiServiceSpy.getOrdersPaged.calls.reset();

    component.onPageChange(1);
    expect(apiServiceSpy.getOrdersPaged).toHaveBeenCalled();
    expect(component.page).toBe(1);
  });

  it('should reload orders and reset page when size changes', () => {
    // Mock response with new size
    const size50Response: PagedResponse<Order> = {
      ...mockPagedResponse,
      size: 50,
      page: 0
    };
    apiServiceSpy.getOrdersPaged.and.returnValue(of(size50Response));
    apiServiceSpy.getOrdersPaged.calls.reset();

    component.page = 2;
    component.onSizeChange(50);
    expect(apiServiceSpy.getOrdersPaged).toHaveBeenCalled();
    expect(component.size).toBe(50);
    expect(component.page).toBe(0);
  });

  it('should navigate to order detail', () => {
    spyOn(router, 'navigate');
    component.viewOrder(1);
    expect(router.navigate).toHaveBeenCalledWith(['/orders', 1]);
  });

  describe('getProductInfo', () => {
    it('should return product name from line items', () => {
      const order = { lineItems: [{ productName: 'Steel Rod' }] } as any;
      expect(component.getProductInfo(order)).toBe('Steel Rod');
    });

    it('should return N/A when no line items', () => {
      const order = { lineItems: [] } as any;
      expect(component.getProductInfo(order)).toBe('N/A');
    });

    it('should return N/A when line items undefined', () => {
      const order = {} as any;
      expect(component.getProductInfo(order)).toBe('N/A');
    });
  });

  describe('getTotalQuantity', () => {
    it('should calculate total quantity', () => {
      const order = {
        lineItems: [{ quantity: 100 }, { quantity: 50 }]
      } as any;
      expect(component.getTotalQuantity(order)).toBe(150);
    });

    it('should return 0 when no line items', () => {
      const order = { lineItems: [] } as any;
      expect(component.getTotalQuantity(order)).toBe(0);
    });

    it('should return 0 when line items undefined', () => {
      const order = {} as any;
      expect(component.getTotalQuantity(order)).toBe(0);
    });
  });

  it('should handle error loading orders', () => {
    apiServiceSpy.getOrdersPaged.and.returnValue(throwError(() => new Error('Error')));

    component.loadOrders();

    expect(component.loading).toBeFalse();
  });

  it('should set loading to false after load', () => {
    expect(component.loading).toBeFalse();
  });
});
