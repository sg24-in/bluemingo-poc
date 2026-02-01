import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.css']
})
export class StatusBadgeComponent {
  @Input() status = '';

  get badgeClass(): string {
    const statusLower = this.status.toLowerCase().replace(/_/g, '-');
    return `badge badge-${statusLower}`;
  }

  get displayStatus(): string {
    return this.status.replace(/_/g, ' ');
  }
}
