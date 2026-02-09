import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HoldListComponent } from './hold-list/hold-list.component';
import { HoldFormComponent } from './hold-form/hold-form.component';
import { HoldDetailComponent } from './hold-detail/hold-detail.component';

const routes: Routes = [
  {
    path: '',
    component: HoldListComponent
  },
  {
    path: 'new',
    component: HoldFormComponent
  },
  {
    path: ':id',
    component: HoldDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HoldsRoutingModule { }
