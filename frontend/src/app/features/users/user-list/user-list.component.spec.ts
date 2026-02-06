import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserListComponent } from './user-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockUsers = [
    { userId: 1, email: 'admin@mes.com', name: 'Admin User', role: 'ADMIN', status: 'ACTIVE' },
    { userId: 2, email: 'operator@mes.com', name: 'Operator User', role: 'OPERATOR', status: 'ACTIVE' }
  ];

  const mockPagedResponse = {
    content: mockUsers,
    totalElements: 2,
    totalPages: 1,
    page: 0,
    size: 20
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getAllUsers',
      'getUsersPaged',
      'deleteUser'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        FormsModule,
        SharedModule
      ],
      declarations: [UserListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    // Mock the appropriate method based on what the component uses
    apiServiceSpy.getAllUsers.and.returnValue(of(mockUsers));
    apiServiceSpy.getUsersPaged.and.returnValue(of(mockPagedResponse));

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(component.users.length).toBeGreaterThan(0);
    expect(component.loading).toBeFalse();
  });

  it('should display users in the list', () => {
    expect(component.users.length).toBe(2);
    expect(component.users[0].email).toBe('admin@mes.com');
  });

  describe('navigation', () => {
    it('should navigate to new user form', () => {
      spyOn(router, 'navigate');

      component.navigateToNew();

      expect(router.navigate).toHaveBeenCalledWith(['/manage/users/new']);
    });

    it('should navigate to edit user form', () => {
      spyOn(router, 'navigate');

      component.navigateToEdit(1);

      expect(router.navigate).toHaveBeenCalledWith(['/manage/users', 1, 'edit']);
    });

    it('should navigate to user detail', () => {
      spyOn(router, 'navigate');

      component.navigateToDetail(1);

      expect(router.navigate).toHaveBeenCalledWith(['/manage/users', 1]);
    });
  });

  describe('delete', () => {
    it('should delete user on confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiServiceSpy.deleteUser.and.returnValue(of(void 0));
      apiServiceSpy.getAllUsers.and.returnValue(of([mockUsers[1]]));

      component.deleteUser(1);

      expect(apiServiceSpy.deleteUser).toHaveBeenCalledWith(1);
    });

    it('should not delete on cancel', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteUser(1);

      expect(apiServiceSpy.deleteUser).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiServiceSpy.deleteUser.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot delete' } }))
      );

      component.deleteUser(1);

      expect(component.error).toBeTruthy();
    });
  });

  describe('filtering', () => {
    it('should filter users by search term', () => {
      component.users = mockUsers;
      component.searchTerm = 'admin';

      const filtered = component.filteredUsers;

      expect(filtered.length).toBe(1);
      expect(filtered[0].email).toContain('admin');
    });

    it('should filter users by role', () => {
      component.users = mockUsers;
      component.filterRole = 'ADMIN';

      const filtered = component.filteredUsers;

      expect(filtered.length).toBe(1);
      expect(filtered[0].role).toBe('ADMIN');
    });

    it('should show all when no filter', () => {
      component.users = mockUsers;
      component.searchTerm = '';
      component.filterRole = 'all';

      expect(component.filteredUsers.length).toBe(2);
    });
  });

  describe('getRoleClass', () => {
    it('should return correct class for ADMIN', () => {
      expect(component.getRoleClass('ADMIN')).toBe('role-admin');
    });

    it('should return correct class for OPERATOR', () => {
      expect(component.getRoleClass('OPERATOR')).toBe('role-operator');
    });

    it('should return correct class for VIEWER', () => {
      expect(component.getRoleClass('VIEWER')).toBe('role-viewer');
    });
  });

  describe('getStatusClass', () => {
    it('should return correct class for ACTIVE', () => {
      expect(component.getStatusClass('ACTIVE')).toBe('status-active');
    });

    it('should return correct class for INACTIVE', () => {
      expect(component.getStatusClass('INACTIVE')).toBe('status-inactive');
    });
  });
});
