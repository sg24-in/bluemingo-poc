import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
  collapsed: boolean;
}

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  menuGroups: MenuGroup[] = [
    {
      title: 'Master Data',
      collapsed: false,
      items: [
        { path: '/manage/customers', label: 'Customers', icon: 'users' },
        { path: '/manage/products', label: 'Products', icon: 'box' },
        { path: '/manage/materials', label: 'Materials', icon: 'layer-group' }
      ]
    },
    {
      title: 'Production',
      collapsed: false,
      items: [
        { path: '/manage/processes', label: 'Processes', icon: 'diagram-project' },
        { path: '/manage/routing', label: 'Routing', icon: 'route' },
        { path: '/manage/equipment', label: 'Equipment', icon: 'gear' },
        { path: '/manage/operators', label: 'Operators', icon: 'id-badge' },
        { path: '/manage/bom', label: 'Bill of Materials', icon: 'sitemap' }
      ]
    },
    {
      title: 'Configuration',
      collapsed: false,
      items: [
        { path: '/manage/config/hold-reasons', label: 'Hold Reasons', icon: 'ban' },
        { path: '/manage/config/delay-reasons', label: 'Delay Reasons', icon: 'hourglass-half' },
        { path: '/manage/config/process-params', label: 'Process Parameters', icon: 'sliders' },
        { path: '/manage/config/batch-number', label: 'Batch Number', icon: 'hashtag' },
        { path: '/manage/config/batch-size', label: 'Batch Size', icon: 'weight-scale' },
        { path: '/manage/config/quantity-type', label: 'Quantity Types', icon: 'list-ol' }
      ]
    },
    {
      title: 'System',
      collapsed: false,
      items: [
        { path: '/manage/users', label: 'Users', icon: 'user-gear' },
        { path: '/manage/audit', label: 'Audit Trail', icon: 'clock-rotate-left' }
      ]
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Expand the group containing the current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.expandActiveGroup();
    });
    this.expandActiveGroup();
  }

  toggleGroup(group: MenuGroup): void {
    group.collapsed = !group.collapsed;
  }

  private expandActiveGroup(): void {
    const currentPath = this.router.url;
    for (const group of this.menuGroups) {
      const hasActiveItem = group.items.some(item => currentPath.startsWith(item.path));
      if (hasActiveItem) {
        group.collapsed = false;
      }
    }
  }
}
