import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../services/admin.service';
import type { AdminListMeta } from '../services/admin.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
})
export class AdminPageComponent {
  readonly #service = inject(AdminService);
  readonly #destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly code = signal<string>('');
  readonly errorKey = signal<string>('');
  readonly lists = signal<Array<AdminListMeta>>([]);
  readonly isAdmin = this.#service.isAdmin;

  onCodeInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.code.set(target.value);
  }

  constructor() {
    this.#service
      .watchListMeta()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (records: Array<AdminListMeta>): void => {
          this.lists.set(records);
        },
        error: (): void => {
          this.lists.set([]);
        },
      });
  }

  async login(): Promise<void> {
    this.errorKey.set('');

    try {
      await this.#service.login(this.code());
    } catch (error) {
      this.errorKey.set(this.errorFrom(error));
    }
  }

  async logout(): Promise<void> {
    await this.#service.logout();
  }

  async deleteList(listId: string, title: string): Promise<void> {
    const ok: boolean = window.confirm(this.i18n.t('admin.deleteConfirm', { title }));
    if (!ok) {
      return;
    }

    await this.#service.deleteList(listId);
  }

  asDate(value: number): string {
    if (Number.isFinite(value) && value > 0) {
      return new Date(value).toLocaleString();
    }
    return '-';
  }

  private errorFrom(error: unknown): string {
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }
    return 'err.generic';
  }
}
