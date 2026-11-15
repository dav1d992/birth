import { Component, signal, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { I18nService } from '../services/i18n.service';
import { OxytocinService } from '../services/oxytocin.service';
import { AdminService } from '../services/admin.service';
import type { AdminListMeta } from '../services/admin.service';

@Component({
  selector: 'app-oxytocin-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './oxytocin-home-page.component.html',
  styleUrl: './oxytocin-home-page.component.scss',
})
export class OxytocinHomePageComponent {
  readonly #service = inject(OxytocinService);
  readonly #router = inject(Router);

  readonly i18n = inject(I18nService);
  readonly admin = inject(AdminService);
  readonly title = signal<string>('');
  readonly password = signal<string>('');
  readonly errorKey = signal<string>('');
  readonly allLists = toSignal(
    toObservable(this.admin.isAdmin).pipe(
      switchMap((isAdmin: boolean) =>
        isAdmin
          ? this.admin.watchListMeta().pipe(catchError(() => of<Array<AdminListMeta>>([])))
          : of<Array<AdminListMeta>>([])
      )
    ),
    { initialValue: [] }
  );

  onTitleInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.title.set(target.value);
  }

  onPasswordInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.password.set(target.value);
  }

  async create(): Promise<void> {
    this.errorKey.set('');

    try {
      const id: string = await this.#service.createList(this.title(), this.password());
      await this.#router.navigate(['/oxytocin', id]);
    } catch (error) {
      this.errorKey.set(this.errorFrom(error));
    }
  }

  async deleteList(listId: string, title: string): Promise<void> {
    if (!window.confirm(this.i18n.t('admin.deleteConfirm', { title }))) {
      return;
    }

    try {
      await this.admin.deleteList(listId);
    } catch (error) {
      this.errorKey.set(this.errorFrom(error));
    }
  }

  asDate(value: number): string {
    return Number.isFinite(value) && value > 0 ? new Date(value).toLocaleString() : '-';
  }

  private errorFrom(error: unknown): string {
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }
    return 'err.generic';
  }
}
