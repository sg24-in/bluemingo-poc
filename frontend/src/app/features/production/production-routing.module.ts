import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductionConfirmComponent } from './production-confirm/production-confirm.component';

const routes: Routes = [
  {
    path: 'confirm/:operationId',
    component: ProductionConfirmComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductionRoutingModule { }
