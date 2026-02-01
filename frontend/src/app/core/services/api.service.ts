import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  // Orders
  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/orders`);
  }

  getAvailableOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/orders/available`);
  }

  getOrderById(orderId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/orders/${orderId}`);
  }

  // Production
  getOperationDetails(operationId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/production/operations/${operationId}`);
  }

  confirmProduction(request: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/production/confirm`, request);
  }

  // Inventory
  getAllInventory(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/inventory`);
  }

  getAvailableInventory(materialId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (materialId) {
      params = params.set('materialId', materialId);
    }
    return this.http.get<any[]>(`${environment.apiUrl}/inventory/available`, { params });
  }

  getInventoryByState(state: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/inventory/state/${state}`);
  }

  getInventoryByType(type: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/inventory/type/${type}`);
  }

  // Batches
  getAllBatches(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/batches`);
  }

  getBatchById(batchId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/batches/${batchId}`);
  }

  getBatchGenealogy(batchId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/batches/${batchId}/genealogy`);
  }

  getAvailableBatches(materialId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (materialId) {
      params = params.set('materialId', materialId);
    }
    return this.http.get<any[]>(`${environment.apiUrl}/batches/available`, { params });
  }

  // Master Data
  getAllEquipment(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/master/equipment`);
  }

  getAvailableEquipment(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/master/equipment/available`);
  }

  getAllOperators(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/master/operators`);
  }

  getActiveOperators(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/master/operators/active`);
  }

  getDelayReasons(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/master/delay-reasons`);
  }

  getHoldReasons(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/master/hold-reasons`);
  }

  getProcessParameters(operationType?: string, productSku?: string): Observable<any[]> {
    let params = new HttpParams();
    if (operationType) {
      params = params.set('operationType', operationType);
    }
    if (productSku) {
      params = params.set('productSku', productSku);
    }
    return this.http.get<any[]>(`${environment.apiUrl}/master/process-parameters`, { params });
  }
}
