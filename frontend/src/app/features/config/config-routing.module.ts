import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HoldReasonsListComponent } from './hold-reasons/hold-reasons-list.component';
import { HoldReasonsFormComponent } from './hold-reasons/hold-reasons-form.component';
import { DelayReasonsListComponent } from './delay-reasons/delay-reasons-list.component';
import { DelayReasonsFormComponent } from './delay-reasons/delay-reasons-form.component';
import { ProcessParamsListComponent } from './process-params/process-params-list.component';
import { ProcessParamsFormComponent } from './process-params/process-params-form.component';
import { BatchNumberListComponent } from './batch-number/batch-number-list.component';
import { BatchNumberFormComponent } from './batch-number/batch-number-form.component';
import { QuantityTypeListComponent } from './quantity-type/quantity-type-list.component';
import { QuantityTypeFormComponent } from './quantity-type/quantity-type-form.component';
import { BatchSizeListComponent } from './batch-size/batch-size-list.component';
import { BatchSizeFormComponent } from './batch-size/batch-size-form.component';

const routes: Routes = [
  { path: '', redirectTo: 'hold-reasons', pathMatch: 'full' },
  { path: 'hold-reasons', component: HoldReasonsListComponent },
  { path: 'hold-reasons/new', component: HoldReasonsFormComponent },
  { path: 'hold-reasons/:id/edit', component: HoldReasonsFormComponent },
  { path: 'delay-reasons', component: DelayReasonsListComponent },
  { path: 'delay-reasons/new', component: DelayReasonsFormComponent },
  { path: 'delay-reasons/:id/edit', component: DelayReasonsFormComponent },
  { path: 'process-params', component: ProcessParamsListComponent },
  { path: 'process-params/new', component: ProcessParamsFormComponent },
  { path: 'process-params/:id/edit', component: ProcessParamsFormComponent },
  { path: 'batch-number', component: BatchNumberListComponent },
  { path: 'batch-number/new', component: BatchNumberFormComponent },
  { path: 'batch-number/:id/edit', component: BatchNumberFormComponent },
  { path: 'quantity-type', component: QuantityTypeListComponent },
  { path: 'quantity-type/new', component: QuantityTypeFormComponent },
  { path: 'quantity-type/:id/edit', component: QuantityTypeFormComponent },
  { path: 'batch-size', component: BatchSizeListComponent },
  { path: 'batch-size/new', component: BatchSizeFormComponent },
  { path: 'batch-size/:id/edit', component: BatchSizeFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfigRoutingModule { }
