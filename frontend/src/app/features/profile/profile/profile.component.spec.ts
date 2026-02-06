import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AuthService, User } from '../../../core/services/auth.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockUser: User = {
    email: 'admin@mes.com',
    fullName: 'Admin User',
    role: 'ADMIN'
  };

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<User | null>(mockUser);

    const spy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: currentUserSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: spy }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load current user on init', () => {
    expect(component.currentUser).toEqual(mockUser);
  });

  it('should update when user changes', () => {
    const newUser: User = {
      email: 'operator@mes.com',
      fullName: 'Operator User',
      role: 'OPERATOR'
    };

    currentUserSubject.next(newUser);
    fixture.detectChanges();

    expect(component.currentUser).toEqual(newUser);
  });

  it('should handle null user', () => {
    currentUserSubject.next(null);
    fixture.detectChanges();

    expect(component.currentUser).toBeNull();
  });

  describe('getUserInitials', () => {
    it('should return initials for two-word name', () => {
      component.currentUser = { ...mockUser, fullName: 'John Doe' };
      expect(component.getUserInitials()).toBe('JD');
    });

    it('should return initials for three-word name', () => {
      component.currentUser = { ...mockUser, fullName: 'John Michael Doe' };
      expect(component.getUserInitials()).toBe('JD');
    });

    it('should return first two chars for single name', () => {
      component.currentUser = { ...mockUser, fullName: 'Admin' };
      expect(component.getUserInitials()).toBe('Ad');
    });

    it('should return ? for null user', () => {
      component.currentUser = null;
      expect(component.getUserInitials()).toBe('?');
    });

    it('should return ? for user with no name', () => {
      component.currentUser = { ...mockUser, fullName: '' };
      expect(component.getUserInitials()).toBe('?');
    });
  });
});
