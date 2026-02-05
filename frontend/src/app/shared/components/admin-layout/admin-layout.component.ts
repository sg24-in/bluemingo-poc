import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  menuItems = [
    { path: '/manage/customers', label: 'Customers', icon: 'people' },
    { path: '/manage/products', label: 'Products', icon: 'box-seam' },
    { path: '/manage/materials', label: 'Materials', icon: 'stack' },
    { path: '/manage/equipment', label: 'Equipment', icon: 'gear' },
    { path: '/manage/bom', label: 'Bill of Materials', icon: 'diagram-3' }
  ];
}
