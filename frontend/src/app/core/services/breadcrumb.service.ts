import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { BehaviorSubject, Observable, filter } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
  icon?: string;
}

// Centralized route-to-breadcrumb mapping
const ROUTE_BREADCRUMBS: { [key: string]: { label: string; icon?: string } } = {
  'dashboard': { label: 'Dashboard', icon: 'fa-chart-line' },
  'orders': { label: 'Orders', icon: 'fa-clipboard-list' },
  'production': { label: 'Production', icon: 'fa-industry' },
  'inventory': { label: 'Inventory', icon: 'fa-warehouse' },
  'batches': { label: 'Batches', icon: 'fa-cubes' },
  'holds': { label: 'Holds', icon: 'fa-hand' },
  'processes': { label: 'Processes', icon: 'fa-diagram-project' },
  'operations': { label: 'Operations', icon: 'fa-gears' },
  'equipment': { label: 'Equipment', icon: 'fa-wrench' },
  'profile': { label: 'Profile', icon: 'fa-user' },
  'change-password': { label: 'Change Password', icon: 'fa-key' },
  'manage': { label: 'Manage', icon: 'fa-sliders' },
  'customers': { label: 'Customers', icon: 'fa-users' },
  'materials': { label: 'Materials', icon: 'fa-box' },
  'products': { label: 'Products', icon: 'fa-tag' },
  'bom': { label: 'Bill of Materials', icon: 'fa-sitemap' },
  'operators': { label: 'Operators', icon: 'fa-id-badge' },
  'config': { label: 'Configuration', icon: 'fa-cog' },
  'audit': { label: 'Audit Trail', icon: 'fa-history' },
  'users': { label: 'Users', icon: 'fa-user-group' },
  'receive': { label: 'Receive Material', icon: 'fa-download' },
  'new': { label: 'New' },
  'edit': { label: 'Edit' },
  'detail': { label: 'Details' },
  'quality-pending': { label: 'Quality Pending', icon: 'fa-clipboard-check' },
};

// Labels for dynamic segments (e.g., when URL contains an ID)
const DYNAMIC_LABELS: { [parentRoute: string]: string } = {
  'orders': 'Order',
  'batches': 'Batch',
  'inventory': 'Inventory Item',
  'equipment': 'Equipment',
  'customers': 'Customer',
  'materials': 'Material',
  'products': 'Product',
  'processes': 'Process',
  'operations': 'Operation',
  'holds': 'Hold',
  'users': 'User',
};

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<Breadcrumb[]>([]);
  public breadcrumbs$: Observable<Breadcrumb[]> = this.breadcrumbsSubject.asObservable();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
      this.breadcrumbsSubject.next(breadcrumbs);
    });
  }

  private buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL = child.snapshot.url.map(segment => segment.path).join('/');

      if (routeURL !== '') {
        url += `/${routeURL}`;

        // Process each segment
        const segments = routeURL.split('/');
        for (const segment of segments) {
          const breadcrumb = this.createBreadcrumb(segment, url, breadcrumbs);
          if (breadcrumb) {
            // Avoid duplicates
            const exists = breadcrumbs.some(b => b.url === breadcrumb.url);
            if (!exists) {
              breadcrumbs.push(breadcrumb);
            }
          }
        }
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  private createBreadcrumb(segment: string, currentUrl: string, existingBreadcrumbs: Breadcrumb[]): Breadcrumb | null {
    // Skip empty segments
    if (!segment) return null;

    // Check if segment is a known route
    const routeInfo = ROUTE_BREADCRUMBS[segment];
    if (routeInfo) {
      return {
        label: routeInfo.label,
        url: currentUrl,
        icon: routeInfo.icon
      };
    }

    // Check if segment is a numeric ID
    if (/^\d+$/.test(segment)) {
      // Get the parent route to determine context
      const parentBreadcrumb = existingBreadcrumbs[existingBreadcrumbs.length - 1];
      if (parentBreadcrumb) {
        const parentSegment = parentBreadcrumb.url.split('/').filter(s => s).pop();
        const dynamicLabel = DYNAMIC_LABELS[parentSegment || ''];
        if (dynamicLabel) {
          return {
            label: `${dynamicLabel} #${segment}`,
            url: currentUrl
          };
        }
      }
      // Generic ID breadcrumb
      return {
        label: `#${segment}`,
        url: currentUrl
      };
    }

    // Default: capitalize the segment
    return {
      label: this.formatSegment(segment),
      url: currentUrl
    };
  }

  private formatSegment(segment: string): string {
    // Convert kebab-case to Title Case
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Manually set breadcrumbs (useful for dynamic titles)
   */
  setBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
    this.breadcrumbsSubject.next(breadcrumbs);
  }

  /**
   * Update the last breadcrumb label (useful for showing entity name instead of ID)
   */
  updateLastBreadcrumb(label: string): void {
    const current = this.breadcrumbsSubject.getValue();
    if (current.length > 0) {
      current[current.length - 1].label = label;
      this.breadcrumbsSubject.next([...current]);
    }
  }
}
