import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductionRoutingModule } from './production-routing.module';
import { ProductionConfirmComponent } from './production-confirm/production-confirm.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ProductionConfirmComponent
  ],
  imports: [
    CommonModule,
    ProductionRoutingModule,
    SharedModule
  ]
})
export class ProductionModule { }
