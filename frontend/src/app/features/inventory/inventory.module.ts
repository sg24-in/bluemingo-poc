import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryListComponent } from './inventory-list/inventory-list.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    InventoryListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    InventoryRoutingModule,
    SharedModule
  ]
})
export class InventoryModule { }
