import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductionConfirmComponent } from './production-confirm/production-confirm.component';
import { ProductionHistoryComponent } from './production-history/production-history.component';

const routes: Routes = [
  {
    path: 'confirm/:operationId',
    component: ProductionConfirmComponent
  },
  {
    path: 'history',
    component: ProductionHistoryComponent
  },
  {
    path: '',
    redirectTo: 'history',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductionRoutingModule { }
