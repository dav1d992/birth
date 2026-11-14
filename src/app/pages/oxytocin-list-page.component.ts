import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Subscription } from 'rxjs';
import { I18nService } from '../services/i18n.service';
import { OxytocinService } from '../services/oxytocin.service';
import type { OxytocinItem } from '../models/oxytocin';

@Component({
  selector: 'app-oxytocin-list-page',
  standalone: true,
  templateUrl: './oxytocin-list-page.component.html',
  styleUrl: './oxytocin-list-page.component.scss',
})
export class OxytocinListPageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #service = inject(OxytocinService);
  readonly #destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly listId = signal<string>('');
  readonly title = signal<string>('');
  readonly password = signal<string>('');
  readonly errorKey = signal<string>('');
  readonly items = signal<Array<OxytocinItem>>([]);
  readonly unlocked = signal<boolean>(false);
  readonly savedPulse = signal<boolean>(false);

  #saveHandle: ReturnType<typeof setTimeout> | null = null;
  #allowAutoSave = false;
  #metaSub: Subscription | null = null;

  constructor() {
    this.#route.paramMap.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((params) => {
      const id: string = params.get('id') ?? '';
      this.setCurrentList(id);
    });

    effect(() => {
      const currentItems: Array<OxytocinItem> = this.items();
      const id: string = this.listId();
      if (!this.#allowAutoSave || id.length === 0 || !this.unlocked()) {
        return;
      }

      if (this.#saveHandle !== null) {
        clearTimeout(this.#saveHandle);
      }

      this.#saveHandle = setTimeout(() => {
        this.persistItems(id, currentItems);
      }, 500);
    });
  }

  onPasswordInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.password.set(target.value);
  }

  onItemTextInput(itemId: string, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const value: string = target.value;
    this.items.update((items: Array<OxytocinItem>): Array<OxytocinItem> =>
      items.map((item: OxytocinItem): OxytocinItem => (item.id === itemId ? { ...item, text: value } : item))
    );
  }

  async unlock(): Promise<void> {
    this.errorKey.set('');

    try {
      const unlockedItems: Array<OxytocinItem> = await this.#service.unlockList(this.listId(), this.password());
      this.items.set(unlockedItems);
      this.unlocked.set(true);
      this.#allowAutoSave = true;
    } catch (error) {
      this.errorKey.set(this.errorFrom(error));
    }
  }

  addItem(): void {
    this.items.update((items: Array<OxytocinItem>): Array<OxytocinItem> => [
      ...items,
      {
        id: crypto.randomUUID(),
        text: '',
        done: false,
      },
    ]);
  }

  toggleDone(itemId: string): void {
    this.items.update((items: Array<OxytocinItem>): Array<OxytocinItem> =>
      items.map((item: OxytocinItem): OxytocinItem => (item.id === itemId ? { ...item, done: !item.done } : item))
    );
  }

  moveUp(index: number): void {
    if (index <= 0) {
      return;
    }
    this.reorder(index, index - 1);
  }

  moveDown(index: number): void {
    if (index >= this.items().length - 1) {
      return;
    }
    this.reorder(index, index + 1);
  }

  deleteItem(itemId: string): void {
    this.items.update((items: Array<OxytocinItem>): Array<OxytocinItem> =>
      items.filter((item: OxytocinItem): boolean => item.id !== itemId)
    );
  }

  async deleteList(): Promise<void> {
    const ok: boolean = window.confirm(this.i18n.t('admin.deleteConfirm', { title: this.title() }));
    if (!ok) {
      return;
    }

    await this.#service.deleteList(this.listId());
    await this.#router.navigate(['/oxytocin']);
  }

  private setCurrentList(id: string): void {
    this.listId.set(id);
    this.unlocked.set(false);
    this.#allowAutoSave = false;
    this.items.set([]);

    if (this.#metaSub !== null) {
      this.#metaSub.unsubscribe();
      this.#metaSub = null;
    }

    this.#metaSub = this.#service
      .watchListMeta(id)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((meta) => {
        this.title.set(meta?.title ?? id);
      });
  }

  private reorder(from: number, to: number): void {
    this.items.update((items: Array<OxytocinItem>): Array<OxytocinItem> => {
      const updated = [...items];
      const moved = updated[from];
      if (moved === undefined) {
        return items;
      }
      updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  }

  private async persistItems(id: string, items: Array<OxytocinItem>): Promise<void> {
    try {
      await this.#service.saveItems(id, items);
      this.savedPulse.set(true);
      setTimeout(() => this.savedPulse.set(false), 700);
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
