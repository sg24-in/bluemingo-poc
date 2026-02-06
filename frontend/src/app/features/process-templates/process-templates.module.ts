import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ProcessTemplatesRoutingModule } from './process-templates-routing.module';
import { ProcessTemplateListComponent } from './process-template-list/process-template-list.component';
import { ProcessTemplateFormComponent } from './process-template-form/process-template-form.component';

@NgModule({
  declarations: [
    ProcessTemplateListComponent,
    ProcessTemplateFormComponent
  ],
  imports: [
    SharedModule,
    ProcessTemplatesRoutingModule
  ]
})
export class ProcessTemplatesModule { }
