import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AuthService, User } from '../../../core/services/auth.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockUser: User = {
    email: 'admin@mes.com',
    fullName: 'Admin User'
  };

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<User | null>(null);

    const spy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: currentUserSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      declarations: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: spy }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to current user on init', () => {
    expect(component.currentUser).toBeNull();
  });

  it('should update current user when auth service emits', () => {
    currentUserSubject.next(mockUser);
    fixture.detectChanges();

    expect(component.currentUser).toEqual(mockUser);
  });

  it('should display user fullName when logged in', () => {
    currentUserSubject.next(mockUser);
    fixture.detectChanges();

    expect(component.currentUser?.fullName).toBe('Admin User');
  });

  it('should display user email when logged in', () => {
    currentUserSubject.next(mockUser);
    fixture.detectChanges();

    expect(component.currentUser?.email).toBe('admin@mes.com');
  });

  it('should call logout on auth service', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  it('should clear current user on logout', () => {
    currentUserSubject.next(mockUser);
    fixture.detectChanges();
    expect(component.currentUser).toEqual(mockUser);

    currentUserSubject.next(null);
    fixture.detectChanges();
    expect(component.currentUser).toBeNull();
  });

  it('should handle multiple user updates', () => {
    currentUserSubject.next(mockUser);
    fixture.detectChanges();
    expect(component.currentUser?.fullName).toBe('Admin User');

    const newUser: User = {
      email: 'operator@mes.com',
      fullName: 'Operator User'
    };
    currentUserSubject.next(newUser);
    fixture.detectChanges();
    expect(component.currentUser?.fullName).toBe('Operator User');
  });

  // Note: Admin menu was refactored - it's now a simple link to /manage
  // The admin layout component handles the sidebar navigation
});
