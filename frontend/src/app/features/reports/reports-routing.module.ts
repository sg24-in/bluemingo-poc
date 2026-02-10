import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsLandingComponent } from './reports-landing/reports-landing.component';
import { ProductionSummaryComponent } from './production-summary/production-summary.component';
import { ScrapAnalysisComponent } from './scrap-analysis/scrap-analysis.component';
import { InventoryBalanceComponent } from './inventory-balance/inventory-balance.component';
import { OrderFulfillmentComponent } from './order-fulfillment/order-fulfillment.component';
import { OperationsReportComponent } from './operations-report/operations-report.component';
import { ExecutiveDashboardComponent } from './executive-dashboard/executive-dashboard.component';

const routes: Routes = [
  { path: '', component: ReportsLandingComponent },
  { path: 'production', component: ProductionSummaryComponent },
  { path: 'scrap', component: ScrapAnalysisComponent },
  { path: 'inventory', component: InventoryBalanceComponent },
  { path: 'orders', component: OrderFulfillmentComponent },
  { path: 'operations', component: OperationsReportComponent },
  { path: 'executive', component: ExecutiveDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
