import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OrderListComponent } from './order-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('OrderListComponent', () => {
  let component: OrderListComponent;
  let fixture: ComponentFixture<OrderListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockOrders = [
    {
      orderId: 1,
      orderNumber: 'ORD-001',
      status: 'IN_PROGRESS',
      lineItems: [{ productName: 'Steel Rod', quantity: 100 }]
    },
    {
      orderId: 2,
      orderNumber: 'ORD-002',
      status: 'COMPLETED',
      lineItems: [{ productName: 'Steel Plate', quantity: 50 }]
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getOrders']);

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
    apiServiceSpy.getOrders.and.returnValue(of(mockOrders as any));
    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load orders on init', () => {
    expect(apiServiceSpy.getOrders).toHaveBeenCalled();
    expect(component.orders.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should apply filter to show all orders', () => {
    component.filterStatus = 'all';
    component.applyFilter();
    expect(component.filteredOrders.length).toBe(2);
  });

  it('should filter orders by status', () => {
    component.onFilterChange('IN_PROGRESS');
    expect(component.filteredOrders.length).toBe(1);
    expect(component.filteredOrders[0].status).toBe('IN_PROGRESS');
  });

  it('should filter orders by COMPLETED status', () => {
    component.onFilterChange('COMPLETED');
    expect(component.filteredOrders.length).toBe(1);
    expect(component.filteredOrders[0].status).toBe('COMPLETED');
  });

  it('should navigate to order detail', () => {
    spyOn(router, 'navigate');
    component.viewOrder(1);
    expect(router.navigate).toHaveBeenCalledWith(['/orders', 1]);
  });

  describe('getProductInfo', () => {
    it('should return product name from line items', () => {
      const order = { lineItems: [{ productName: 'Steel Rod' }] };
      expect(component.getProductInfo(order)).toBe('Steel Rod');
    });

    it('should return N/A when no line items', () => {
      const order = { lineItems: [] };
      expect(component.getProductInfo(order)).toBe('N/A');
    });

    it('should return N/A when line items undefined', () => {
      const order = {};
      expect(component.getProductInfo(order)).toBe('N/A');
    });
  });

  describe('getTotalQuantity', () => {
    it('should calculate total quantity', () => {
      const order = {
        lineItems: [{ quantity: 100 }, { quantity: 50 }]
      };
      expect(component.getTotalQuantity(order)).toBe(150);
    });

    it('should return 0 when no line items', () => {
      const order = { lineItems: [] };
      expect(component.getTotalQuantity(order)).toBe(0);
    });

    it('should return 0 when line items undefined', () => {
      const order = {};
      expect(component.getTotalQuantity(order)).toBe(0);
    });
  });

  it('should handle error loading orders', () => {
    apiServiceSpy.getOrders.and.returnValue(throwError(() => new Error('Error')));

    component.loadOrders();

    expect(component.loading).toBeFalse();
  });

  it('should set loading to false after load', () => {
    expect(component.loading).toBeFalse();
  });
});
