import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ProductionSummaryComponent } from './production-summary.component';

describe('ProductionSummaryComponent', () => {
  let component: ProductionSummaryComponent;
  let fixture: ComponentFixture<ProductionSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductionSummaryComponent],
      imports: [RouterTestingModule, HttpClientTestingModule, FormsModule]
    }).compileComponents();
    fixture = TestBed.createComponent(ProductionSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with date range', () => {
    expect(component.startDate).toBeTruthy();
    expect(component.endDate).toBeTruthy();
  });

  it('should default to 30-day range', () => {
    const start = new Date(component.startDate);
    const end = new Date(component.endDate);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  it('should start in loading state', () => {
    expect(component.loading).toBeTrue();
  });

  it('should have empty error initially', () => {
    expect(component.error).toBe('');
  });

  it('should have null summary initially', () => {
    expect(component.summary).toBeNull();
  });

  it('should not call loadData if startDate is empty on date change', () => {
    spyOn(component, 'loadData');
    component.startDate = '';
    component.onDateChange();
    expect(component.loadData).not.toHaveBeenCalled();
  });

  it('should call loadData if both dates are set on date change', () => {
    spyOn(component, 'loadData');
    component.startDate = '2026-01-01';
    component.endDate = '2026-01-31';
    component.onDateChange();
    expect(component.loadData).toHaveBeenCalled();
  });
});
