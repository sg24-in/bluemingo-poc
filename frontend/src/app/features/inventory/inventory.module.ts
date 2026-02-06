import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryListComponent } from './inventory-list/inventory-list.component';
import { InventoryFormComponent } from './inventory-form/inventory-form.component';
import { InventoryDetailComponent } from './inventory-detail/inventory-detail.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    InventoryListComponent,
    InventoryFormComponent,
    InventoryDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InventoryRoutingModule,
    SharedModule
  ]
})
export class InventoryModule { }
