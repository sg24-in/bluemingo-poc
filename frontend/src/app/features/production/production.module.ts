import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductionRoutingModule } from './production-routing.module';
import { ProductionConfirmComponent } from './production-confirm/production-confirm.component';
import { ProductionHistoryComponent } from './production-history/production-history.component';
import { ProductionLandingComponent } from './production-landing/production-landing.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ProductionConfirmComponent,
    ProductionHistoryComponent,
    ProductionLandingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProductionRoutingModule,
    SharedModule
  ]
})
export class ProductionModule { }
