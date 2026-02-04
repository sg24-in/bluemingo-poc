import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProcessesRoutingModule } from './processes-routing.module';
import { QualityPendingComponent } from './quality-pending/quality-pending.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    QualityPendingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProcessesRoutingModule,
    SharedModule
  ]
})
export class ProcessesModule { }
