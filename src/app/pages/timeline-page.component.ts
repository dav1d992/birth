import { Component, signal, inject } from '@angular/core';
import { BIRTH_PHASES, PREGNANCY_OVERVIEW } from '../models/timeline';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-timeline-page',
  standalone: true,
  templateUrl: './timeline-page.component.html',
  styleUrl: './timeline-page.component.scss',
})
export class TimelinePageComponent {
  readonly i18n = inject(I18nService);
  readonly overview = PREGNANCY_OVERVIEW;
  readonly phases = BIRTH_PHASES;
  readonly expanded = signal<Record<string, boolean>>({});

  toggle(id: string): void {
    this.expanded.update((state: Record<string, boolean>): Record<string, boolean> => ({
      ...state,
      [id]: !state[id],
    }));
  }

  isExpanded(id: string): boolean {
    return this.expanded()[id] ?? false;
  }
}
