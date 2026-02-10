import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { InventoryBalanceComponent } from './inventory-balance.component';

describe('InventoryBalanceComponent', () => {
  let component: InventoryBalanceComponent;
  let fixture: ComponentFixture<InventoryBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InventoryBalanceComponent],
      imports: [RouterTestingModule, HttpClientTestingModule]
    }).compileComponents();
    fixture = TestBed.createComponent(InventoryBalanceComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in loading state', () => {
    expect(component.loading).toBeTrue();
  });

  it('should have null balanceData initially', () => {
    expect(component.balanceData).toBeNull();
  });

  it('should have empty error initially', () => {
    expect(component.error).toBe('');
  });

  it('should return correct type label for RM', () => {
    expect(component.getTypeLabel('RM')).toBe('Raw Material');
  });

  it('should return correct type label for WIP', () => {
    expect(component.getTypeLabel('WIP')).toBe('Work in Progress');
  });

  it('should return correct type label for IM', () => {
    expect(component.getTypeLabel('IM')).toBe('Intermediate');
  });

  it('should return correct type label for FG', () => {
    expect(component.getTypeLabel('FG')).toBe('Finished Goods');
  });

  it('should return correct state class for AVAILABLE', () => {
    expect(component.getStateClass('AVAILABLE')).toBe('state-available');
  });

  it('should return correct state class for BLOCKED', () => {
    expect(component.getStateClass('BLOCKED')).toBe('state-blocked');
  });

  it('should return empty string for unknown state', () => {
    expect(component.getStateClass('UNKNOWN')).toBe('');
  });
});
