import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductionConfirmComponent } from './production-confirm/production-confirm.component';
import { ProductionHistoryComponent } from './production-history/production-history.component';
import { ProductionLandingComponent } from './production-landing/production-landing.component';

const routes: Routes = [
  {
    path: '',
    component: ProductionLandingComponent
  },
  {
    path: 'confirm/:operationId',
    component: ProductionConfirmComponent
  },
  {
    path: 'history',
    component: ProductionHistoryComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductionRoutingModule { }
