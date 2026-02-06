import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialsRoutingModule } from './materials-routing.module';
import { MaterialListComponent } from './material-list/material-list.component';
import { MaterialFormComponent } from './material-form/material-form.component';
import { MaterialDetailComponent } from './material-detail/material-detail.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    MaterialListComponent,
    MaterialFormComponent,
    MaterialDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialsRoutingModule,
    SharedModule
  ]
})
export class MaterialsModule { }
