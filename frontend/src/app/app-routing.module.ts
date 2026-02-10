import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';
import { AdminLayoutComponent } from './shared/components/admin-layout/admin-layout.component';
import { ManageLandingComponent } from './shared/components/manage-landing/manage-landing.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule)
      },
      {
        path: 'production',
        loadChildren: () => import('./features/production/production.module').then(m => m.ProductionModule)
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.module').then(m => m.InventoryModule)
      },
      {
        path: 'batches',
        loadChildren: () => import('./features/batches/batches.module').then(m => m.BatchesModule)
      },
      {
        path: 'holds',
        loadChildren: () => import('./features/holds/holds.module').then(m => m.HoldsModule)
      },
      {
        path: 'equipment',
        loadChildren: () => import('./features/equipment/equipment.module').then(m => m.EquipmentModule)
      },
      {
        path: 'operations',
        loadChildren: () => import('./features/operations/operations.module').then(m => m.OperationsModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule)
      },
      {
        path: 'change-password',
        loadChildren: () => import('./features/change-password/change-password.module').then(m => m.ChangePasswordModule)
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule)
      }
    ]
  },
  {
    path: 'manage',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: ManageLandingComponent,
        pathMatch: 'full'
      },
      {
        path: 'customers',
        loadChildren: () => import('./features/customers/customers.module').then(m => m.CustomersModule)
      },
      {
        path: 'materials',
        loadChildren: () => import('./features/materials/materials.module').then(m => m.MaterialsModule)
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule)
      },
      {
        path: 'bom',
        loadChildren: () => import('./features/bom/bom.module').then(m => m.BomModule)
      },
      {
        path: 'equipment',
        loadChildren: () => import('./features/equipment/equipment.module').then(m => m.EquipmentModule)
      },
      {
        path: 'operators',
        loadChildren: () => import('./features/operators/operators.module').then(m => m.OperatorsModule)
      },
      {
        path: 'config',
        loadChildren: () => import('./features/config/config.module').then(m => m.ConfigModule)
      },
      {
        path: 'audit',
        loadChildren: () => import('./features/audit/audit.module').then(m => m.AuditModule)
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule)
      },
      {
        path: 'processes',
        loadChildren: () => import('./features/processes/processes.module').then(m => m.ProcessesModule)
      },
      {
        path: 'routing',
        loadChildren: () => import('./features/routing/routing.module').then(m => m.RoutingModule)
      },
      {
        path: 'operation-templates',
        loadChildren: () => import('./features/operation-templates/operation-templates.module').then(m => m.OperationTemplatesModule)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
