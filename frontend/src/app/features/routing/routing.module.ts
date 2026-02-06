import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RoutingRoutingModule } from './routing-routing.module';
import { RoutingListComponent } from './routing-list/routing-list.component';
import { RoutingFormComponent } from './routing-form/routing-form.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    RoutingListComponent,
    RoutingFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RoutingRoutingModule,
    SharedModule
  ]
})
export class RoutingModule { }
