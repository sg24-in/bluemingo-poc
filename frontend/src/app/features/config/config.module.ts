import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfigRoutingModule } from './config-routing.module';
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
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    HoldReasonsListComponent,
    HoldReasonsFormComponent,
    DelayReasonsListComponent,
    DelayReasonsFormComponent,
    ProcessParamsListComponent,
    ProcessParamsFormComponent,
    BatchNumberListComponent,
    BatchNumberFormComponent,
    QuantityTypeListComponent,
    QuantityTypeFormComponent,
    BatchSizeListComponent,
    BatchSizeFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConfigRoutingModule,
    SharedModule
  ]
})
export class ConfigModule { }
