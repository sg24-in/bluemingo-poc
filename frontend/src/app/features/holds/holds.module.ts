import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HoldsRoutingModule } from './holds-routing.module';
import { HoldListComponent } from './hold-list/hold-list.component';
import { HoldFormComponent } from './hold-form/hold-form.component';
import { HoldDetailComponent } from './hold-detail/hold-detail.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    HoldListComponent,
    HoldFormComponent,
    HoldDetailComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HoldsRoutingModule,
    SharedModule
  ]
})
export class HoldsModule { }
