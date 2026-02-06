import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OperatorListComponent } from './operator-list/operator-list.component';
import { OperatorFormComponent } from './operator-form/operator-form.component';
import { OperatorDetailComponent } from './operator-detail/operator-detail.component';

const routes: Routes = [
  {
    path: '',
    component: OperatorListComponent
  },
  {
    path: 'new',
    component: OperatorFormComponent
  },
  {
    path: ':id',
    component: OperatorDetailComponent
  },
  {
    path: ':id/edit',
    component: OperatorFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperatorsRoutingModule { }
