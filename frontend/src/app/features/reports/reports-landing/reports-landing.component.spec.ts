import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ReportsLandingComponent } from './reports-landing.component';

describe('ReportsLandingComponent', () => {
  let component: ReportsLandingComponent;
  let fixture: ComponentFixture<ReportsLandingComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportsLandingComponent],
      imports: [RouterTestingModule, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsLandingComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 6 report cards', () => {
    expect(component.reportCards.length).toBe(6);
  });

  it('should have production summary as first card', () => {
    expect(component.reportCards[0].title).toBe('Production Summary');
  });

  it('should navigate to correct route on card click', () => {
    spyOn(router, 'navigate');
    component.navigateTo('/reports/production');
    expect(router.navigate).toHaveBeenCalledWith(['/reports/production']);
  });
});
