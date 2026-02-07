import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QualityPendingComponent } from './quality-pending/quality-pending.component';
import { ProcessListComponent } from './process-list/process-list.component';
import { ProcessDetailComponent } from './process-detail/process-detail.component';
import { ProcessFormComponent } from './process-form/process-form.component';

const routes: Routes = [
  {
    path: 'quality-pending',
    component: QualityPendingComponent
  },
  {
    path: 'list',
    component: ProcessListComponent
  },
  {
    path: 'new',
    component: ProcessFormComponent
  },
  {
    path: ':id/edit',
    component: ProcessFormComponent
  },
  {
    path: ':id',
    component: ProcessDetailComponent
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProcessesRoutingModule { }
