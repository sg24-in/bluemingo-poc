import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  profileMenuOpen = false;
  mobileMenuOpen = false;
  expandedDropdown: string | null = null;
  private routerSub: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Close mobile menu on route navigation
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.mobileMenuOpen = false;
      this.expandedDropdown = null;
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      this.profileMenuOpen = false;
    }
  }

  // Close dropdown on escape key
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.profileMenuOpen = false;
    this.mobileMenuOpen = false;
    this.expandedDropdown = null;
  }

  // Close mobile menu on window resize (when switching to desktop)
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (window.innerWidth > 992) {
      this.mobileMenuOpen = false;
      this.expandedDropdown = null;
    }
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  closeProfileMenu(): void {
    this.profileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (!this.mobileMenuOpen) {
      this.expandedDropdown = null;
    }
  }

  toggleDropdown(dropdown: string, event: Event): void {
    // Only toggle on mobile
    if (window.innerWidth <= 992) {
      event.preventDefault();
      event.stopPropagation();
      this.expandedDropdown = this.expandedDropdown === dropdown ? null : dropdown;
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    this.expandedDropdown = null;
  }

  getUserInitials(): string {
    if (!this.currentUser?.fullName) return '?';
    const names = this.currentUser.fullName.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0].substring(0, 2);
  }

  confirmLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.logout();
    }
  }

  logout(): void {
    this.profileMenuOpen = false;
    this.authService.logout();
  }

  // Check if Orders dropdown should be highlighted
  isOrdersActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/orders') || url.startsWith('/production');
  }

  // Check if Manufacturing dropdown should be highlighted
  isManufacturingActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/operations') || url.startsWith('/equipment');
  }

  // Check if Inventory dropdown should be highlighted
  isInventoryActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/inventory') || url.startsWith('/batches');
  }

  // Check if Quality dropdown should be highlighted
  isQualityActive(): boolean {
    const url = this.router.url;
    return url.startsWith('/holds');
  }
}
