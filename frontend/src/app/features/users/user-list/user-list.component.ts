import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../shared/models';
import { PageRequest, PagedResponse } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error: string | null = null;

  // Pagination
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  // Filters
  searchTerm = '';
  statusFilter = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'userId',
      sortDirection: 'ASC'
    };

    if (this.searchTerm) {
      request.search = this.searchTerm;
    }
    if (this.statusFilter) {
      request.status = this.statusFilter;
    }

    this.apiService.getUsersPaged(request).subscribe({
      next: (response: PagedResponse<User>) => {
        this.users = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = !response.last;
        this.hasPrevious = !response.first;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.page = 0;
    this.loadUsers();
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadUsers();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadUsers();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadUsers();
  }

  viewUser(userId: number): void {
    this.router.navigate(['/manage/users', userId]);
  }

  editUser(userId: number): void {
    this.router.navigate(['/manage/users', userId, 'edit']);
  }

  createUser(): void {
    this.router.navigate(['/manage/users', 'new']);
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to deactivate user "${user.name}"?`)) {
      this.apiService.deleteUser(user.userId).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          this.error = 'Failed to deactivate user';
        }
      });
    }
  }

  activateUser(user: User): void {
    this.apiService.activateUser(user.userId).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error activating user:', err);
        this.error = 'Failed to activate user';
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'status-active';
      case 'INACTIVE':
        return 'status-inactive';
      default:
        return '';
    }
  }
}
