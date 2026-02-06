import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProcessTemplateListComponent } from './process-template-list/process-template-list.component';
import { ProcessTemplateFormComponent } from './process-template-form/process-template-form.component';

const routes: Routes = [
  { path: '', component: ProcessTemplateListComponent },
  { path: 'new', component: ProcessTemplateFormComponent },
  { path: ':id', component: ProcessTemplateFormComponent },
  { path: ':id/edit', component: ProcessTemplateFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProcessTemplatesRoutingModule { }
