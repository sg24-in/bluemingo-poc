import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QualityPendingComponent } from './quality-pending/quality-pending.component';

const routes: Routes = [
  {
    path: 'quality-pending',
    component: QualityPendingComponent
  },
  {
    path: '',
    redirectTo: 'quality-pending',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProcessesRoutingModule { }
