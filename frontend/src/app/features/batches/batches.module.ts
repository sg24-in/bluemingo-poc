import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BatchesRoutingModule } from './batches-routing.module';
import { BatchListComponent } from './batch-list/batch-list.component';
import { BatchDetailComponent } from './batch-detail/batch-detail.component';
import { BatchFormComponent } from './batch-form/batch-form.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    BatchListComponent,
    BatchDetailComponent,
    BatchFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BatchesRoutingModule,
    SharedModule
  ]
})
export class BatchesModule { }
