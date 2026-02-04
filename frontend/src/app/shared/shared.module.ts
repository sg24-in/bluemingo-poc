import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { PaginationComponent } from './components/pagination/pagination.component';

@NgModule({
  declarations: [
    HeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    PaginationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    PaginationComponent
  ]
})
export class SharedModule { }
