import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProcessesRoutingModule } from './processes-routing.module';
import { QualityPendingComponent } from './quality-pending/quality-pending.component';
import { ProcessListComponent } from './process-list/process-list.component';
import { ProcessDetailComponent } from './process-detail/process-detail.component';
import { ProcessFormComponent } from './process-form/process-form.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    QualityPendingComponent,
    ProcessListComponent,
    ProcessDetailComponent,
    ProcessFormComponent
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
