import { Component } from '@angular/core';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  menuGroups: MenuGroup[] = [
    {
      title: 'Master Data',
      items: [
        { path: '/manage/customers', label: 'Customers', icon: 'users' },
        { path: '/manage/products', label: 'Products', icon: 'box' },
        { path: '/manage/materials', label: 'Materials', icon: 'layer-group' }
      ]
    },
    {
      title: 'Production',
      items: [
        { path: '/manage/equipment', label: 'Equipment', icon: 'gear' },
        { path: '/manage/operators', label: 'Operators', icon: 'id-badge' },
        { path: '/manage/bom', label: 'Bill of Materials', icon: 'sitemap' }
      ]
    },
    {
      title: 'System',
      items: [
        { path: '/manage/users', label: 'Users', icon: 'user-gear' },
        { path: '/manage/config', label: 'Configuration', icon: 'sliders' },
        { path: '/manage/audit', label: 'Audit Trail', icon: 'clock-rotate-left' }
      ]
    }
  ];
}
