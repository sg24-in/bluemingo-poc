import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OperationTemplatesRoutingModule } from './operation-templates-routing.module';
import { OperationTemplateListComponent } from './operation-template-list/operation-template-list.component';
import { OperationTemplateFormComponent } from './operation-template-form/operation-template-form.component';
import { OperationTemplateDetailComponent } from './operation-template-detail/operation-template-detail.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    OperationTemplateListComponent,
    OperationTemplateFormComponent,
    OperationTemplateDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OperationTemplatesRoutingModule,
    SharedModule
  ]
})
export class OperationTemplatesModule { }
