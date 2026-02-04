import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PAGE_SIZE_OPTIONS } from '../../models/pagination.model';

/**
 * Reusable pagination component for all list pages.
 * Displays page navigation, page size selector, and total counts.
 */
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent {

  @Input() page = 0;
  @Input() size = 20;
  @Input() totalElements = 0;
  @Input() totalPages = 0;
  @Input() hasNext = false;
  @Input() hasPrevious = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();

  pageSizeOptions = PAGE_SIZE_OPTIONS;

  get startIndex(): number {
    return this.page * this.size + 1;
  }

  get endIndex(): number {
    return Math.min((this.page + 1) * this.size, this.totalElements);
  }

  goToFirstPage(): void {
    if (this.page > 0) {
      this.pageChange.emit(0);
    }
  }

  goToPreviousPage(): void {
    if (this.hasPrevious) {
      this.pageChange.emit(this.page - 1);
    }
  }

  goToNextPage(): void {
    if (this.hasNext) {
      this.pageChange.emit(this.page + 1);
    }
  }

  goToLastPage(): void {
    if (this.page < this.totalPages - 1) {
      this.pageChange.emit(this.totalPages - 1);
    }
  }

  onSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    this.sizeChange.emit(newSize);
  }

  /**
   * Get visible page numbers for pagination.
   */
  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.page - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible);

    // Adjust start if we're near the end
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    for (let i = start; i < end; i++) {
      pages.push(i);
    }

    return pages;
  }

  goToPage(pageNumber: number): void {
    if (pageNumber >= 0 && pageNumber < this.totalPages && pageNumber !== this.page) {
      this.pageChange.emit(pageNumber);
    }
  }
}
