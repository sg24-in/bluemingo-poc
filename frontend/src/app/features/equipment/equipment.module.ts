import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentRoutingModule } from './equipment-routing.module';
import { EquipmentListComponent } from './equipment-list/equipment-list.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    EquipmentListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    EquipmentRoutingModule,
    SharedModule
  ]
})
export class EquipmentModule { }
