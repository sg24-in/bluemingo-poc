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
    size: 20,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
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

      component.createUser();

      expect(router.navigate).toHaveBeenCalledWith(['/manage/users', 'new']);
    });

    it('should navigate to edit user form', () => {
      spyOn(router, 'navigate');

      component.editUser(1);

      expect(router.navigate).toHaveBeenCalledWith(['/manage/users', 1, 'edit']);
    });

    it('should navigate to user detail', () => {
      spyOn(router, 'navigate');

      component.viewUser(1);

      expect(router.navigate).toHaveBeenCalledWith(['/manage/users', 1]);
    });
  });

  describe('delete', () => {
    it('should delete user on confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiServiceSpy.deleteUser.and.returnValue(of({ message: 'User deactivated' }));

      component.deleteUser(mockUsers[0]);

      expect(apiServiceSpy.deleteUser).toHaveBeenCalledWith(1);
    });

    it('should not delete on cancel', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteUser(mockUsers[0]);

      expect(apiServiceSpy.deleteUser).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiServiceSpy.deleteUser.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot delete' } }))
      );

      component.deleteUser(mockUsers[0]);

      expect(component.error).toBeTruthy();
    });
  });

  describe('filtering', () => {
    it('should trigger search with onSearch', () => {
      component.searchTerm = 'admin';
      component.page = 2;

      component.onSearch();

      expect(component.page).toBe(0); // Reset to first page
      expect(apiServiceSpy.getUsersPaged).toHaveBeenCalled();
    });

    it('should trigger filter change with onFilterChange', () => {
      component.statusFilter = 'ACTIVE';
      component.page = 2;

      component.onFilterChange();

      expect(component.page).toBe(0); // Reset to first page
      expect(apiServiceSpy.getUsersPaged).toHaveBeenCalled();
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
