import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface ReportCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  kpiLabel?: string;
  kpiValue?: string;
}

@Component({
  selector: 'app-reports-landing',
  templateUrl: './reports-landing.component.html',
  styleUrls: ['./reports-landing.component.css']
})
export class ReportsLandingComponent implements OnInit {
  loading = true;
  error = '';

  reportCards: ReportCard[] = [
    {
      title: 'Production Summary',
      description: 'Total produced, scrap, yield %, avg cycle time',
      icon: 'fa-industry',
      route: '/reports/production'
    },
    {
      title: 'Quality & Scrap',
      description: 'Scrap analysis by product and operation type',
      icon: 'fa-chart-pie',
      route: '/reports/scrap'
    },
    {
      title: 'Inventory Balance',
      description: 'Inventory by type (RM/WIP/FG) and state',
      icon: 'fa-boxes-stacked',
      route: '/reports/inventory'
    },
    {
      title: 'Order Fulfillment',
      description: 'Completion rate, in-progress, overdue orders',
      icon: 'fa-clipboard-check',
      route: '/reports/orders'
    },
    {
      title: 'Operations & Holds',
      description: 'Cycle times, hold analysis by entity type',
      icon: 'fa-gears',
      route: '/reports/operations'
    },
    {
      title: 'Executive Dashboard',
      description: 'One-screen overview of all KPIs',
      icon: 'fa-chart-line',
      route: '/reports/executive'
    }
  ];

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.apiService.getExecutiveDashboard().subscribe({
      next: (data) => {
        this.reportCards[0].kpiLabel = 'Yield';
        this.reportCards[0].kpiValue = data.productionSummary?.yieldPercentage?.toFixed(1) + '%' || '-';
        this.reportCards[1].kpiLabel = 'Total Scrap';
        this.reportCards[1].kpiValue = data.productionSummary?.totalScrap?.toFixed(0) || '0';
        this.reportCards[2].kpiLabel = 'Items';
        this.reportCards[2].kpiValue = String(data.inventoryBalance?.totalItems || 0);
        this.reportCards[3].kpiLabel = 'Completion';
        this.reportCards[3].kpiValue = data.orderFulfillment?.completionPercentage?.toFixed(0) + '%' || '-';
        this.reportCards[4].kpiLabel = 'Active Holds';
        this.reportCards[4].kpiValue = String(data.holdAnalysis?.totalActiveHolds || 0);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load report summaries';
        this.loading = false;
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
