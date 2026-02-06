import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductionRoutingModule } from './production-routing.module';
import { ProductionConfirmComponent } from './production-confirm/production-confirm.component';
import { ProductionHistoryComponent } from './production-history/production-history.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ProductionConfirmComponent,
    ProductionHistoryComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ProductionRoutingModule,
    SharedModule
  ]
})
export class ProductionModule { }
