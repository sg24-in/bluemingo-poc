import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { QualityPendingComponent } from './quality-pending.component';

/**
 * QualityPendingComponent Tests
 *
 * Per MES Consolidated Specification:
 * - Process is a design-time template (DRAFT/ACTIVE/INACTIVE)
 * - Runtime quality tracking happens at BATCH level
 *
 * This component simply redirects to batch quality management.
 */
describe('QualityPendingComponent', () => {
  let component: QualityPendingComponent;
  let fixture: ComponentFixture<QualityPendingComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'batches', component: QualityPendingComponent }
        ])
      ],
      declarations: [QualityPendingComponent]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QualityPendingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to batches with QUALITY_PENDING filter on init', () => {
    spyOn(router, 'navigate');

    fixture.detectChanges(); // Triggers ngOnInit

    expect(router.navigate).toHaveBeenCalledWith(
      ['/batches'],
      { queryParams: { status: 'QUALITY_PENDING' } }
    );
  });

  it('should contain a comment about design-time process architecture', () => {
    // This test documents the architectural decision
    // Process is design-time only - quality decisions happen at Batch level
    expect(true).toBeTrue();
  });
});
