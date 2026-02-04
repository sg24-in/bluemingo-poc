import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HoldListComponent } from './hold-list/hold-list.component';

const routes: Routes = [
  {
    path: '',
    component: HoldListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HoldsRoutingModule { }
