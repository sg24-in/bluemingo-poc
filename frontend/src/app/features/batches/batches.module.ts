import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BatchesRoutingModule } from './batches-routing.module';
import { BatchListComponent } from './batch-list/batch-list.component';
import { BatchDetailComponent } from './batch-detail/batch-detail.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    BatchListComponent,
    BatchDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BatchesRoutingModule,
    SharedModule
  ]
})
export class BatchesModule { }
