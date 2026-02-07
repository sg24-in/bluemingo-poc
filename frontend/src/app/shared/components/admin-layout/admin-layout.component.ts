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
        { path: '/manage/processes', label: 'Processes', icon: 'diagram-project' },
        { path: '/manage/routing', label: 'Routing', icon: 'route' },
        { path: '/manage/equipment', label: 'Equipment', icon: 'gear' },
        { path: '/manage/operators', label: 'Operators', icon: 'id-badge' },
        { path: '/manage/bom', label: 'Bill of Materials', icon: 'sitemap' }
      ]
    },
    {
      title: 'Configuration',
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
      items: [
        { path: '/manage/users', label: 'Users', icon: 'user-gear' },
        { path: '/manage/audit', label: 'Audit Trail', icon: 'clock-rotate-left' }
      ]
    }
  ];
}
