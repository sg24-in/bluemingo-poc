import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  form: FormGroup;
  userId: number | null = null;
  isEditMode = false;
  loading = false;
  saving = false;
  error: string | null = null;

  // Password reset modal
  showResetPasswordModal = false;
  newPassword = '';
  resettingPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      employeeId: [''],
      status: ['ACTIVE']
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.userId = +idParam;
      this.isEditMode = true;
      // In edit mode, password is not required
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.loadUser();
    }
  }

  loadUser(): void {
    if (!this.userId) return;

    this.loading = true;
    this.apiService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.form.patchValue({
          email: user.email,
          name: user.name,
          employeeId: user.employeeId || '',
          status: user.status
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.error = 'Failed to load user';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    if (this.isEditMode && this.userId) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser(): void {
    const request = {
      email: this.form.value.email,
      name: this.form.value.name,
      password: this.form.value.password,
      employeeId: this.form.value.employeeId || undefined
    };

    this.apiService.createUser(request).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/manage/users']);
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to create user';
        console.error('Error creating user:', err);
      }
    });
  }

  private updateUser(): void {
    if (!this.userId) return;

    const request = {
      name: this.form.value.name,
      employeeId: this.form.value.employeeId || undefined,
      status: this.form.value.status
    };

    this.apiService.updateUser(this.userId, request).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/manage/users']);
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to update user';
        console.error('Error updating user:', err);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/manage/users']);
  }

  openResetPasswordModal(): void {
    this.showResetPasswordModal = true;
    this.newPassword = '';
  }

  closeResetPasswordModal(): void {
    this.showResetPasswordModal = false;
    this.newPassword = '';
  }

  resetPassword(): void {
    if (!this.userId || !this.newPassword || this.newPassword.length < 6) {
      return;
    }

    this.resettingPassword = true;
    this.apiService.resetPassword(this.userId, { newPassword: this.newPassword }).subscribe({
      next: () => {
        this.resettingPassword = false;
        this.showResetPasswordModal = false;
        this.newPassword = '';
        alert('Password reset successfully');
      },
      error: (err) => {
        this.resettingPassword = false;
        console.error('Error resetting password:', err);
        alert('Failed to reset password');
      }
    });
  }

  get title(): string {
    return this.isEditMode ? 'Edit User' : 'Create User';
  }
}
