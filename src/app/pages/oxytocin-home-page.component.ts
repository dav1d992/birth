import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18nService } from '../services/i18n.service';
import { OxytocinService } from '../services/oxytocin.service';
import { AdminService } from '../services/admin.service';
import type { RememberedList } from '../models/oxytocin';

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
  readonly rememberedLists = signal<Array<RememberedList>>([]);

  constructor() {
    void this.loadLists();
  }

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
      await this.loadLists();
      await this.#router.navigate(['/oxytocin', id]);
    } catch (error) {
      this.errorKey.set(this.errorFrom(error));
    }
  }

  private async loadLists(): Promise<void> {
    try {
      this.rememberedLists.set(await this.#service.loadRememberedLists());
    } catch {
      this.rememberedLists.set([]);
    }
  }

  private errorFrom(error: unknown): string {
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }
    return 'err.generic';
  }
}
