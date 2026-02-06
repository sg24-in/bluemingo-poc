import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HoldsRoutingModule } from './holds-routing.module';
import { HoldListComponent } from './hold-list/hold-list.component';
import { HoldDetailComponent } from './hold-detail/hold-detail.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    HoldListComponent,
    HoldDetailComponent
  ],
  imports: [
    CommonModule,
    HoldsRoutingModule,
    SharedModule
  ]
})
export class HoldsModule { }
