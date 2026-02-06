import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OperationListComponent } from './operation-list/operation-list.component';
import { OperationDetailComponent } from './operation-detail/operation-detail.component';

const routes: Routes = [
  {
    path: '',
    component: OperationListComponent
  },
  {
    path: ':id',
    component: OperationDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperationsRoutingModule { }
