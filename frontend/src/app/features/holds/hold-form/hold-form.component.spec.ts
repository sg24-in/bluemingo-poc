import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HoldFormComponent } from './hold-form.component';

describe('HoldFormComponent', () => {
  let component: HoldFormComponent;
  let fixture: ComponentFixture<HoldFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HoldFormComponent],
      imports: [ReactiveFormsModule, RouterTestingModule, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(HoldFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with required fields', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('entityType')).toBeTruthy();
    expect(component.form.get('entityId')).toBeTruthy();
    expect(component.form.get('reason')).toBeTruthy();
    expect(component.form.get('comments')).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('should have valid form when all required fields are filled', () => {
    component.form.patchValue({
      entityType: 'ORDER',
      entityId: 1,
      reason: 'QUALITY_HOLD'
    });
    expect(component.form.valid).toBeTruthy();
  });

  it('should display entity type options', () => {
    expect(component.entityTypes).toContain('ORDER');
    expect(component.entityTypes).toContain('BATCH');
    expect(component.entityTypes).toContain('INVENTORY');
    expect(component.entityTypes).toContain('EQUIPMENT');
    expect(component.entityTypes).toContain('OPERATION');
  });

  it('should show entity type labels correctly', () => {
    expect(component.getEntityTypeLabel('ORDER')).toBe('Order');
    expect(component.getEntityTypeLabel('BATCH')).toBe('Batch');
    expect(component.getEntityTypeLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should detect form field errors', () => {
    const control = component.form.get('entityType');
    control?.markAsTouched();
    expect(component.hasError('entityType')).toBeTruthy();

    control?.setValue('ORDER');
    expect(component.hasError('entityType')).toBeFalsy();
  });

  it('should render the form title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-title')?.textContent).toContain('Apply Hold');
  });

  it('should render hold warning message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hold-warning')).toBeTruthy();
  });
});
