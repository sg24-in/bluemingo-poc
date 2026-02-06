import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoutingListComponent } from './routing-list/routing-list.component';
import { RoutingFormComponent } from './routing-form/routing-form.component';

const routes: Routes = [
  {
    path: '',
    component: RoutingListComponent
  },
  {
    path: 'new',
    component: RoutingFormComponent
  },
  {
    path: ':id/edit',
    component: RoutingFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RoutingRoutingModule { }
