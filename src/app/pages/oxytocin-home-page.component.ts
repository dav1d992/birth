import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18nService } from '../services/i18n.service';
import { OxytocinService } from '../services/oxytocin.service';
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
  readonly title = signal<string>('');
  readonly password = signal<string>('');
  readonly errorKey = signal<string>('');
  readonly rememberedLists = signal<Array<RememberedList>>(this.#service.readRememberedLists());

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
      this.rememberedLists.set(this.#service.readRememberedLists());
      await this.#router.navigate(['/oxytocin', id]);
    } catch (error) {
      this.errorKey.set(this.errorFrom(error));
    }
  }

  private errorFrom(error: unknown): string {
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }
    return 'err.generic';
  }
}
