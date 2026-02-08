import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { MaterialSelectionModalComponent } from './components/material-selection-modal/material-selection-modal.component';

@NgModule({
  declarations: [
    HeaderComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    PaginationComponent,
    MainLayoutComponent,
    BreadcrumbComponent,
    MaterialSelectionModalComponent
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
    PaginationComponent,
    MainLayoutComponent,
    BreadcrumbComponent,
    MaterialSelectionModalComponent
  ]
})
export class SharedModule { }
