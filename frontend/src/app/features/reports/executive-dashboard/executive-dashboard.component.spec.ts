import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExecutiveDashboardComponent } from './executive-dashboard.component';

describe('ExecutiveDashboardComponent', () => {
  let component: ExecutiveDashboardComponent;
  let fixture: ComponentFixture<ExecutiveDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExecutiveDashboardComponent],
      imports: [RouterTestingModule, HttpClientTestingModule]
    }).compileComponents();
    fixture = TestBed.createComponent(ExecutiveDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in loading state', () => {
    expect(component.loading).toBeTrue();
  });

  it('should have null data initially', () => {
    expect(component.data).toBeNull();
  });

  it('should have empty error initially', () => {
    expect(component.error).toBe('');
  });

  it('should return correct yield class for high yield', () => {
    expect(component.getYieldClass(96)).toBe('yield-good');
  });

  it('should return correct yield class for medium yield', () => {
    expect(component.getYieldClass(88)).toBe('yield-warning');
  });

  it('should return correct yield class for low yield', () => {
    expect(component.getYieldClass(70)).toBe('yield-danger');
  });

  it('should return correct completion class for high completion', () => {
    expect(component.getCompletionClass(95)).toBe('completion-good');
  });

  it('should return correct completion class for medium completion', () => {
    expect(component.getCompletionClass(80)).toBe('completion-warning');
  });

  it('should return correct completion class for low completion', () => {
    expect(component.getCompletionClass(60)).toBe('completion-danger');
  });

  it('should return correct type label for RM', () => {
    expect(component.getTypeLabel('RM')).toBe('Raw Material');
  });

  it('should return correct type label for FG', () => {
    expect(component.getTypeLabel('FG')).toBe('Finished Goods');
  });

  it('should return original type for unknown type', () => {
    expect(component.getTypeLabel('CUSTOM')).toBe('CUSTOM');
  });
});
