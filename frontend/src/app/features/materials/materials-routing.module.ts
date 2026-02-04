import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MaterialListComponent } from './material-list/material-list.component';
import { MaterialFormComponent } from './material-form/material-form.component';

const routes: Routes = [
  {
    path: '',
    component: MaterialListComponent
  },
  {
    path: 'new',
    component: MaterialFormComponent
  },
  {
    path: ':id/edit',
    component: MaterialFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MaterialsRoutingModule { }
