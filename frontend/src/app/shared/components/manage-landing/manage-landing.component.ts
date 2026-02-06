import { Component } from '@angular/core';

interface Tile {
  path: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}

interface TileGroup {
  title: string;
  tiles: Tile[];
}

@Component({
  selector: 'app-manage-landing',
  templateUrl: './manage-landing.component.html',
  styleUrls: ['./manage-landing.component.css']
})
export class ManageLandingComponent {
  tileGroups: TileGroup[] = [
    {
      title: 'Master Data',
      tiles: [
        { path: '/manage/customers', label: 'Customers', icon: 'users', description: 'Manage customer accounts and contacts', color: '#1976d2' },
        { path: '/manage/products', label: 'Products', icon: 'box', description: 'Manage product catalog and SKUs', color: '#388e3c' },
        { path: '/manage/materials', label: 'Materials', icon: 'layer-group', description: 'Manage raw materials and intermediates', color: '#f57c00' }
      ]
    },
    {
      title: 'Production',
      tiles: [
        { path: '/manage/equipment', label: 'Equipment', icon: 'gear', description: 'Manage machines and equipment', color: '#7b1fa2' },
        { path: '/manage/operators', label: 'Operators', icon: 'id-badge', description: 'Manage production operators', color: '#0097a7' },
        { path: '/manage/bom', label: 'Bill of Materials', icon: 'sitemap', description: 'Manage product BOM structures', color: '#c62828' }
      ]
    },
    {
      title: 'System',
      tiles: [
        { path: '/manage/config', label: 'Configuration', icon: 'sliders', description: 'System settings and parameters', color: '#455a64' },
        { path: '/manage/audit', label: 'Audit Trail', icon: 'clock-rotate-left', description: 'View system activity logs', color: '#5d4037' }
      ]
    }
  ];
}
