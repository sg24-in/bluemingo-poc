import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsLandingComponent } from './reports-landing/reports-landing.component';
import { ProductionSummaryComponent } from './production-summary/production-summary.component';
import { ScrapAnalysisComponent } from './scrap-analysis/scrap-analysis.component';
import { InventoryBalanceComponent } from './inventory-balance/inventory-balance.component';
import { OrderFulfillmentComponent } from './order-fulfillment/order-fulfillment.component';
import { OperationsReportComponent } from './operations-report/operations-report.component';
import { ExecutiveDashboardComponent } from './executive-dashboard/executive-dashboard.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ReportsLandingComponent,
    ProductionSummaryComponent,
    ScrapAnalysisComponent,
    InventoryBalanceComponent,
    OrderFulfillmentComponent,
    OperationsReportComponent,
    ExecutiveDashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReportsRoutingModule,
    SharedModule
  ]
})
export class ReportsModule { }
