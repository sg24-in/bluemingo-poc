import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OrderFulfillmentComponent } from './order-fulfillment.component';

describe('OrderFulfillmentComponent', () => {
  let component: OrderFulfillmentComponent;
  let fixture: ComponentFixture<OrderFulfillmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderFulfillmentComponent],
      imports: [RouterTestingModule, HttpClientTestingModule]
    }).compileComponents();
    fixture = TestBed.createComponent(OrderFulfillmentComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in loading state', () => {
    expect(component.loading).toBeTrue();
  });

  it('should have null fulfillmentData initially', () => {
    expect(component.fulfillmentData).toBeNull();
  });

  it('should return correct completion class', () => {
    expect(component.getCompletionClass(95)).toBe('completion-good');
    expect(component.getCompletionClass(80)).toBe('completion-warning');
    expect(component.getCompletionClass(60)).toBe('completion-danger');
  });

  it('should calculate pending orders correctly', () => {
    component.fulfillmentData = {
      totalOrders: 10,
      completedOrders: 3,
      inProgressOrders: 4,
      overdueOrders: 1,
      completionPercentage: 30
    };
    expect(component.pendingOrders).toBe(2);
  });

  it('should return 0 pending orders when no data', () => {
    component.fulfillmentData = null;
    expect(component.pendingOrders).toBe(0);
  });
});
