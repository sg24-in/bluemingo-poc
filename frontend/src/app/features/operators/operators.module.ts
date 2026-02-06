import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OperatorsRoutingModule } from './operators-routing.module';
import { OperatorListComponent } from './operator-list/operator-list.component';
import { OperatorFormComponent } from './operator-form/operator-form.component';
import { OperatorDetailComponent } from './operator-detail/operator-detail.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    OperatorListComponent,
    OperatorFormComponent,
    OperatorDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OperatorsRoutingModule,
    SharedModule
  ]
})
export class OperatorsModule { }
