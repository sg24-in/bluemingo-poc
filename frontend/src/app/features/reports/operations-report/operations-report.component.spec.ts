import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { OperationsReportComponent } from './operations-report.component';

describe('OperationsReportComponent', () => {
  let component: OperationsReportComponent;
  let fixture: ComponentFixture<OperationsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OperationsReportComponent],
      imports: [RouterTestingModule, HttpClientTestingModule, FormsModule]
    }).compileComponents();
    fixture = TestBed.createComponent(OperationsReportComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with date range', () => {
    expect(component.startDate).toBeTruthy();
    expect(component.endDate).toBeTruthy();
  });

  it('should start in loading state', () => {
    expect(component.loading).toBeTrue();
  });

  it('should have empty cycleTimes initially', () => {
    expect(component.cycleTimes).toEqual([]);
  });

  it('should have null holdAnalysis initially', () => {
    expect(component.holdAnalysis).toBeNull();
  });

  it('should return warning class when avg is close to max', () => {
    expect(component.getCycleTimeClass(95, 100)).toBe('cycle-warning');
    expect(component.getCycleTimeClass(50, 100)).toBe('');
  });

  it('should not call loadData if startDate is empty on date change', () => {
    spyOn(component, 'loadData');
    component.startDate = '';
    component.onDateChange();
    expect(component.loadData).not.toHaveBeenCalled();
  });
});
