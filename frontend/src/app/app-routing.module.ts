import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

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
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'orders',
    loadChildren: () => import('./features/orders/orders.module').then(m => m.OrdersModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'production',
    loadChildren: () => import('./features/production/production.module').then(m => m.ProductionModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'inventory',
    loadChildren: () => import('./features/inventory/inventory.module').then(m => m.InventoryModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'batches',
    loadChildren: () => import('./features/batches/batches.module').then(m => m.BatchesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'holds',
    loadChildren: () => import('./features/holds/holds.module').then(m => m.HoldsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'processes',
    loadChildren: () => import('./features/processes/processes.module').then(m => m.ProcessesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'equipment',
    loadChildren: () => import('./features/equipment/equipment.module').then(m => m.EquipmentModule),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
