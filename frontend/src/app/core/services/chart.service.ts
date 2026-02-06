import { Injectable, NgZone, OnDestroy } from '@angular/core';

/** Centralized chart font sizes — use these in all chart options */
export const CHART_FONT = {
  title: 11,
  axisLabel: 9,
  label: 8,
  labelBold: 9,
  emphasis: 10,
  edgeLabel: 8,
  tooltip: 10
};

// Tree-shakeable ECharts imports
import * as echarts from 'echarts/core';
import { PieChart, BarChart, GraphChart, SankeyChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register only the components we need
echarts.use([
  PieChart,
  BarChart,
  GraphChart,
  SankeyChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer
]);

@Injectable({
  providedIn: 'root'
})
export class ChartService implements OnDestroy {
  private charts = new Map<string, echarts.ECharts>();
  private resizeHandler: (() => void) | null = null;

  constructor(private ngZone: NgZone) {
    this.setupResizeListener();
  }

  initChart(element: HTMLElement, chartId: string): echarts.ECharts {
    // Dispose existing chart with same ID
    this.disposeChart(chartId);

    let chart: echarts.ECharts;
    this.ngZone.runOutsideAngular(() => {
      chart = echarts.init(element);
    });
    this.charts.set(chartId, chart!);
    return chart!;
  }

  setOption(chartId: string, option: echarts.EChartsCoreOption): void {
    const chart = this.charts.get(chartId);
    if (chart) {
      this.ngZone.runOutsideAngular(() => {
        chart.setOption(option);
      });
    }
  }

  getChart(chartId: string): echarts.ECharts | undefined {
    return this.charts.get(chartId);
  }

  disposeChart(chartId: string): void {
    const chart = this.charts.get(chartId);
    if (chart) {
      chart.dispose();
      this.charts.delete(chartId);
    }
  }

  disposeAll(): void {
    this.charts.forEach((chart) => {
      chart.dispose();
    });
    this.charts.clear();
  }

  private setupResizeListener(): void {
    this.ngZone.runOutsideAngular(() => {
      this.resizeHandler = () => {
        this.charts.forEach((chart) => {
          chart.resize();
        });
      };
      window.addEventListener('resize', this.resizeHandler);
    });
  }

  ngOnDestroy(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.disposeAll();
  }
}
