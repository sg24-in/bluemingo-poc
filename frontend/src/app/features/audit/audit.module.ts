import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditRoutingModule } from './audit-routing.module';
import { AuditListComponent } from './audit-list/audit-list.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    AuditListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AuditRoutingModule,
    SharedModule
  ]
})
export class AuditModule { }
