import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EquipmentRoutingModule } from './equipment-routing.module';
import { EquipmentListComponent } from './equipment-list/equipment-list.component';
import { EquipmentFormComponent } from './equipment-form/equipment-form.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    EquipmentListComponent,
    EquipmentFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EquipmentRoutingModule,
    SharedModule
  ]
})
export class EquipmentModule { }
