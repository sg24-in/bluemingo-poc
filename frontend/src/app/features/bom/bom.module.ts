import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { BomRoutingModule } from './bom-routing.module';
import { BomListComponent } from './bom-list/bom-list.component';
import { BomTreeComponent } from './bom-tree/bom-tree.component';
import { BomNodeFormComponent } from './bom-node-form/bom-node-form.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    BomListComponent,
    BomTreeComponent,
    BomNodeFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    BomRoutingModule,
    SharedModule
  ]
})
export class BomModule { }
