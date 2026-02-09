import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OperationTemplateListComponent } from './operation-template-list/operation-template-list.component';
import { OperationTemplateFormComponent } from './operation-template-form/operation-template-form.component';
import { OperationTemplateDetailComponent } from './operation-template-detail/operation-template-detail.component';

const routes: Routes = [
  {
    path: '',
    component: OperationTemplateListComponent
  },
  {
    path: 'new',
    component: OperationTemplateFormComponent
  },
  {
    path: ':id',
    component: OperationTemplateDetailComponent
  },
  {
    path: ':id/edit',
    component: OperationTemplateFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperationTemplatesRoutingModule { }
