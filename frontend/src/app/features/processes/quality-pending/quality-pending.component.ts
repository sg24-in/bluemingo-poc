import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Quality Pending Component
 *
 * Per MES Consolidated Specification:
 * - Process is a design-time template (DRAFT/ACTIVE/INACTIVE)
 * - Runtime quality tracking happens at BATCH level
 *
 * This component redirects to batch quality management.
 */
@Component({
  selector: 'app-quality-pending',
  templateUrl: './quality-pending.component.html',
  styleUrls: ['./quality-pending.component.css']
})
export class QualityPendingComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Process is design-time only - quality decisions happen at Batch level
    // Redirect to batches page with quality pending filter
    this.router.navigate(['/batches'], { queryParams: { status: 'QUALITY_PENDING' } });
  }
}
