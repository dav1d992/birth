import { Component, DestroyRef, ElementRef, effect, inject, signal } from '@angular/core';
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
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly i18n = inject(I18nService);
  readonly listId = signal<string>('');
  readonly title = signal<string>('');
  readonly password = signal<string>('');
  readonly errorKey = signal<string>('');
  readonly items = signal<Array<OxytocinItem>>([]);
  readonly unlocked = signal<boolean>(false);
  readonly showInfo = signal<boolean>(false);
  readonly linkCopied = signal<boolean>(false);

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

  toggleInfo(): void {
    this.showInfo.update((value: boolean): boolean => !value);
  }

  async shareLink(): Promise<void> {
    const url: string = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      this.linkCopied.set(true);
      setTimeout((): void => this.linkCopied.set(false), 2000);
    } catch {
      window.prompt(this.i18n.t('oxytocin.list.share'), url);
    }
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
    this.flipReorder((): void => {
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
    });
  }

  private flipReorder(mutate: () => void): void {
    const reduceMotion: boolean = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      mutate();
      return;
    }

    const first: Map<string, number> = this.measureRows();
    mutate();

    requestAnimationFrame((): void => {
      const rows = this.#host.nativeElement.querySelectorAll<HTMLLIElement>('li[data-id]');
      rows.forEach((row: HTMLLIElement): void => {
        const id: string | undefined = row.dataset['id'];
        if (id === undefined) {
          return;
        }
        const previousTop: number | undefined = first.get(id);
        if (previousTop === undefined) {
          return;
        }
        const delta: number = previousTop - row.getBoundingClientRect().top;
        if (delta === 0) {
          return;
        }
        row.animate(
          [{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }],
          { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
      });
    });
  }

  private measureRows(): Map<string, number> {
    const positions = new Map<string, number>();
    const rows = this.#host.nativeElement.querySelectorAll<HTMLLIElement>('li[data-id]');
    rows.forEach((row: HTMLLIElement): void => {
      const id: string | undefined = row.dataset['id'];
      if (id !== undefined) {
        positions.set(id, row.getBoundingClientRect().top);
      }
    });
    return positions;
  }

  private async persistItems(id: string, items: Array<OxytocinItem>): Promise<void> {
    try {
      await this.#service.saveItems(id, items);
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
