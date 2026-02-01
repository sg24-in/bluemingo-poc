import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BatchListComponent } from './batch-list/batch-list.component';
import { BatchDetailComponent } from './batch-detail/batch-detail.component';

const routes: Routes = [
  {
    path: '',
    component: BatchListComponent
  },
  {
    path: ':batchId',
    component: BatchDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BatchesRoutingModule { }
