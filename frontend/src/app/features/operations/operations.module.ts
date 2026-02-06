import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperationsRoutingModule } from './operations-routing.module';
import { OperationListComponent } from './operation-list/operation-list.component';
import { OperationDetailComponent } from './operation-detail/operation-detail.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    OperationListComponent,
    OperationDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    OperationsRoutingModule,
    SharedModule
  ]
})
export class OperationsModule { }
