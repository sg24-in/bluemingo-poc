import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { User } from '../../../shared/models';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadUser(+idParam);
    } else {
      this.error = 'No user ID provided';
      this.loading = false;
    }
  }

  loadUser(userId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.error = 'Failed to load user';
        this.loading = false;
      }
    });
  }

  editUser(): void {
    if (this.user) {
      this.router.navigate(['/manage/users', this.user.userId, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/manage/users']);
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

  toggleStatus(): void {
    if (!this.user) return;

    if (this.user.status === 'ACTIVE') {
      if (confirm(`Are you sure you want to deactivate user "${this.user.name}"?`)) {
        this.apiService.deactivateUser(this.user.userId).subscribe({
          next: () => {
            this.loadUser(this.user!.userId);
          },
          error: (err) => {
            console.error('Error deactivating user:', err);
            this.error = 'Failed to deactivate user';
          }
        });
      }
    } else {
      this.apiService.activateUser(this.user.userId).subscribe({
        next: () => {
          this.loadUser(this.user!.userId);
        },
        error: (err) => {
          console.error('Error activating user:', err);
          this.error = 'Failed to activate user';
        }
      });
    }
  }
}
