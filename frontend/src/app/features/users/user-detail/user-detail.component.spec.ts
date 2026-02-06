import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserDetailComponent } from './user-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('UserDetailComponent', () => {
  let component: UserDetailComponent;
  let fixture: ComponentFixture<UserDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockUser = {
    userId: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'OPERATOR',
    status: 'ACTIVE',
    createdOn: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getUserById',
      'deactivateUser',
      'activateUser'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [UserDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getUserById.and.returnValue(of(mockUser));
    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user on init', () => {
    expect(apiServiceSpy.getUserById).toHaveBeenCalledWith(1);
    expect(component.user).toEqual(mockUser);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing user ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getUserById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [UserDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No user ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading user', () => {
    apiServiceSpy.getUserById.and.returnValue(throwError(() => new Error('Error')));

    component.loadUser(1);

    expect(component.error).toBe('Failed to load user');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to edit user', () => {
    spyOn(router, 'navigate');
    component.editUser();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/users', 1, 'edit']);
  });

  it('should navigate back to user list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/users']);
  });

  it('should return correct status class for ACTIVE', () => {
    expect(component.getStatusClass('ACTIVE')).toBe('status-active');
  });

  it('should return correct status class for INACTIVE', () => {
    expect(component.getStatusClass('INACTIVE')).toBe('status-inactive');
  });

  it('should deactivate active user', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deactivateUser.and.returnValue(of({ ...mockUser, status: 'INACTIVE' }));
    apiServiceSpy.getUserById.and.returnValue(of({ ...mockUser, status: 'INACTIVE' }));

    component.toggleStatus();

    expect(apiServiceSpy.deactivateUser).toHaveBeenCalledWith(1);
  });

  it('should not deactivate if user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.toggleStatus();

    expect(apiServiceSpy.deactivateUser).not.toHaveBeenCalled();
  });

  it('should activate inactive user', () => {
    component.user = { ...mockUser, status: 'INACTIVE' };
    apiServiceSpy.activateUser.and.returnValue(of({ ...mockUser, status: 'ACTIVE' }));

    component.toggleStatus();

    expect(apiServiceSpy.activateUser).toHaveBeenCalledWith(1);
  });

  it('should handle deactivation error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deactivateUser.and.returnValue(throwError(() => new Error('Error')));

    component.toggleStatus();

    expect(component.error).toBe('Failed to deactivate user');
  });

  it('should handle activation error', () => {
    component.user = { ...mockUser, status: 'INACTIVE' };
    apiServiceSpy.activateUser.and.returnValue(throwError(() => new Error('Error')));

    component.toggleStatus();

    expect(component.error).toBe('Failed to activate user');
  });
});
