import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

/**
 * ApiService Tests
 * Note: Mock data uses partial objects cast to any for test convenience.
 * This tests HTTP behavior, not interface conformance.
 */
describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Orders', () => {
    it('should get all orders', () => {
      const mockOrders = [
        { orderId: 1, status: 'IN_PROGRESS' },
        { orderId: 2, status: 'CREATED' }
      ] as any;

      service.getOrders().subscribe(orders => {
        expect(orders).toEqual(mockOrders);
        expect(orders.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/orders`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrders);
    });

    it('should get available orders', () => {
      const mockOrders = [{ orderId: 1, status: 'IN_PROGRESS' }] as any;

      service.getAvailableOrders().subscribe(orders => {
        expect(orders).toEqual(mockOrders);
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/available`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrders);
    });

    it('should get order by id', () => {
      const mockOrder = { orderId: 1, status: 'IN_PROGRESS' } as any;

      service.getOrderById(1).subscribe(order => {
        expect(order).toEqual(mockOrder);
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);
    });
  });

  describe('Production', () => {
    it('should get operation details', () => {
      const mockOperation = { operationId: 1, operationName: 'Melting' } as any;

      service.getOperationDetails(1).subscribe(operation => {
        expect(operation).toEqual(mockOperation);
      });

      const req = httpMock.expectOne(`${apiUrl}/production/operations/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOperation);
    });

    it('should confirm production', () => {
      const mockRequest = {
        operationId: 1,
        producedQty: 100,
        materialsConsumed: [],
        startTime: '2024-01-01T10:00:00',
        endTime: '2024-01-01T11:00:00',
        equipmentIds: [1],
        operatorIds: [1]
      } as any;
      const mockResponse = { confirmationId: 1, status: 'CONFIRMED' } as any;

      service.confirmProduction(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/production/confirm`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });

  describe('Inventory', () => {
    it('should get all inventory', () => {
      const mockInventory = [
        { inventoryId: 1, state: 'AVAILABLE' },
        { inventoryId: 2, state: 'CONSUMED' }
      ] as any;

      service.getAllInventory().subscribe(inventory => {
        expect(inventory).toEqual(mockInventory);
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory`);
      expect(req.request.method).toBe('GET');
      req.flush(mockInventory);
    });

    it('should get available inventory', () => {
      const mockInventory = [{ inventoryId: 1, state: 'AVAILABLE' }] as any;

      service.getAvailableInventory().subscribe(inventory => {
        expect(inventory).toEqual(mockInventory);
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory/available`);
      expect(req.request.method).toBe('GET');
      req.flush(mockInventory);
    });

    it('should get inventory by state', () => {
      const mockInventory = [{ inventoryId: 1, state: 'AVAILABLE' }] as any;

      service.getInventoryByState('AVAILABLE').subscribe(inventory => {
        expect(inventory).toEqual(mockInventory);
      });

      const req = httpMock.expectOne(`${apiUrl}/inventory/state/AVAILABLE`);
      expect(req.request.method).toBe('GET');
      req.flush(mockInventory);
    });
  });

  describe('Holds', () => {
    it('should get active holds', () => {
      const mockHolds = [{ holdId: 1, entityType: 'OPERATION', status: 'ACTIVE' }] as any;

      service.getActiveHolds().subscribe(holds => {
        expect(holds).toEqual(mockHolds);
      });

      const req = httpMock.expectOne(`${apiUrl}/holds/active`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHolds);
    });

    it('should apply hold', () => {
      const mockRequest = { entityType: 'OPERATION', entityId: 1, reason: 'Test' } as any;
      const mockResponse = { holdId: 1, status: 'ACTIVE' } as any;

      service.applyHold(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/holds`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should release hold', () => {
      const mockResponse = { holdId: 1, status: 'RELEASED' } as any;

      service.releaseHold(1, 'Issue resolved').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/holds/1/release`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });

    it('should get active hold count', () => {
      const mockCount = { activeHolds: 5 };

      service.getActiveHoldCount().subscribe(count => {
        expect(count).toEqual(mockCount);
      });

      const req = httpMock.expectOne(`${apiUrl}/holds/count`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCount);
    });
  });

  describe('Dashboard', () => {
    it('should get dashboard summary', () => {
      const mockSummary = {
        totalOrders: 10,
        operationsReady: 5,
        activeHolds: 2,
        todayConfirmations: 3
      } as any;

      service.getDashboardSummary().subscribe(summary => {
        expect(summary).toEqual(mockSummary);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/summary`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSummary);
    });
  });

  describe('BOM', () => {
    it('should get BOM requirements', () => {
      const mockBom = {
        productSku: 'TEST-001',
        requirements: [{ materialId: 'RM-001', quantityRequired: 100 }]
      } as any;

      service.getBomRequirements('TEST-001').subscribe(bom => {
        expect(bom).toEqual(mockBom);
      });

      const req = httpMock.expectOne(`${apiUrl}/bom/TEST-001/requirements`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBom);
    });

    it('should validate BOM consumption', () => {
      const mockRequest = {
        productSku: 'TEST-001',
        targetQuantity: 100,
        materialsConsumed: [{ materialId: 'RM-001', quantity: 100 }]
      } as any;
      const mockResponse = { valid: true, warnings: [], errors: [], requirementChecks: [] } as any;

      service.validateBomConsumption(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/bom/validate`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('Master Data', () => {
    it('should get available equipment', () => {
      const mockEquipment = [{ equipmentId: 1, name: 'Furnace 1' }] as any;

      service.getAvailableEquipment().subscribe(equipment => {
        expect(equipment).toEqual(mockEquipment);
      });

      const req = httpMock.expectOne(`${apiUrl}/master/equipment/available`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEquipment);
    });

    it('should get active operators', () => {
      const mockOperators = [{ operatorId: 1, operatorName: 'John Doe' }] as any;

      service.getActiveOperators().subscribe(operators => {
        expect(operators).toEqual(mockOperators);
      });

      const req = httpMock.expectOne(`${apiUrl}/master/operators/active`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOperators);
    });
  });
});
