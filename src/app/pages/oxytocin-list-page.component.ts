import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
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

  readonly drafts = signal<Record<string, string>>({});
  readonly busy = signal(false);
  readonly syncing = signal(false);
  #pendingIds = new Set<string>();
  #remoteItems: Array<OxytocinItem> = [];
  #itemsSub: Subscription | null = null;
  #metaSub: Subscription | null = null;

  constructor() {
    this.#route.paramMap.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((params) => {
      const id: string = params.get('id') ?? '';
      this.setCurrentList(id);
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
    if (!(target instanceof HTMLTextAreaElement)) {
      return;
    }

    this.drafts.update((drafts) => ({ ...drafts, [itemId]: target.value }));
  }

  async unlock(): Promise<void> {
    if (this.busy()) return;
    const id = this.listId();
    this.busy.set(true);
    this.errorKey.set('');

    try {
      const unlockedItems = await this.#service.unlockList(id, this.password());
      if (this.listId() !== id || this.#destroyRef.destroyed) return;
      this.items.set(unlockedItems);
      this.#remoteItems = unlockedItems;
      this.unlocked.set(true);
      this.password.set('');
      this.syncing.set(true);
      this.#itemsSub?.unsubscribe();
      this.#itemsSub = this.#service.watchItems(id)
        .pipe(takeUntilDestroyed(this.#destroyRef))
        .subscribe({
          next: (items) => {
            this.#remoteItems = items;
            this.flipReorder(() => this.applyRemoteItems());
          },
          error: (error: unknown) => {
            this.syncing.set(false);
            this.errorKey.set(this.errorFrom(error));
            if (error instanceof Error && error.message === 'err.notFound') {
              this.items.set([]);
              this.unlocked.set(false);
            }
          },
        });
    } catch (error) {
      if (this.listId() === id) this.errorKey.set(this.errorFrom(error));
    } finally {
      if (this.listId() === id) this.busy.set(false);
    }
  }

  addItem(): void {
    const id = crypto.randomUUID();
    this.#pendingIds.add(id);
    this.drafts.update((drafts) => ({ ...drafts, [id]: '' }));
    this.items.update((items: Array<OxytocinItem>): Array<OxytocinItem> => [
      ...items,
      {
        id,
        text: '',
        done: false,
      },
    ]);
  }

  async submitItem(item: OxytocinItem): Promise<void> {
    const text = (this.drafts()[item.id] ?? item.text).trim();
    if (text.length === 0 || this.busy()) return;
    const draft = this.drafts()[item.id];
    const isNew = this.#pendingIds.has(item.id);
    const saved = await this.persistMutation((items) => {
      if (isNew) return [...items.filter((entry) => entry.id !== item.id), { ...item, text }];
      if (!items.some((entry) => entry.id === item.id)) throw new Error('err.notFound');
      return items.map((entry) => entry.id === item.id ? { ...entry, text } : entry);
    });
    if (saved) {
      this.#pendingIds.delete(item.id);
      if (this.drafts()[item.id] === draft) {
        this.drafts.update((drafts) => {
          const next = { ...drafts };
          delete next[item.id];
          return next;
        });
      }
    }
  }

  isPending(id: string): boolean {
    return this.#pendingIds.has(id);
  }

  private applyRemoteItems(): void {
    const remoteIds = new Set(this.#remoteItems.map((item) => item.id));
    const pending = this.items().filter((item) => this.#pendingIds.has(item.id) && !remoteIds.has(item.id));
    this.items.set([...this.#remoteItems, ...pending]);
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
    if (this.busy()) return;
    if (this.#pendingIds.delete(itemId)) {
      this.items.update((items) => items.filter((item) => item.id !== itemId));
      return;
    }
    void this.persistMutation((items) => items.filter((item) => item.id !== itemId));
  }

  async deleteList(): Promise<void> {
    if (this.busy()) return;
    const ok: boolean = window.confirm(this.i18n.t('admin.deleteConfirm', { title: this.title() }));
    if (!ok) {
      return;
    }

    this.busy.set(true);
    try {
      await this.#service.deleteList(this.listId());
      await this.#router.navigate(['/oxytocin']);
    } catch (error) {
      this.errorKey.set(this.errorFrom(error));
    } finally {
      this.busy.set(false);
    }
  }

  private setCurrentList(id: string): void {
    this.listId.set(id);
    this.title.set('');
    this.unlocked.set(false);
    this.#itemsSub?.unsubscribe();
    this.#itemsSub = null;
    this.#pendingIds.clear();
    this.#remoteItems = [];
    this.drafts.set({});
    this.busy.set(false);
    this.syncing.set(false);
    this.password.set('');
    this.errorKey.set('');
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
    if (this.busy()) return;
    const moved = this.items()[from];
    const target = this.items()[to];
    if (!moved || !target || this.isPending(moved.id) || this.isPending(target.id)) return;
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
    void this.persistMutation((items) => {
      const next = [...items];
      const sourceIndex = next.findIndex((item) => item.id === moved.id);
      if (sourceIndex < 0 || !next.some((item) => item.id === target.id)) return items;
      const [entry] = next.splice(sourceIndex, 1);
      if (!entry) return items;
      const targetIndex = next.findIndex((item) => item.id === target.id);
      next.splice(targetIndex + (to > from ? 1 : 0), 0, entry);
      return next;
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

  private async persistMutation(mutate: (items: Array<OxytocinItem>) => Array<OxytocinItem>): Promise<boolean> {
    if (this.busy()) return false;
    const id = this.listId();
    this.busy.set(true);
    this.errorKey.set('');
    try {
      await this.#service.mutateItems(id, mutate);
      return this.listId() === id && !this.#destroyRef.destroyed;
    } catch (error) {
      if (this.listId() === id) {
        this.errorKey.set(this.errorFrom(error));
        this.applyRemoteItems();
      }
      return false;
    } finally {
      if (this.listId() === id) this.busy.set(false);
    }
  }

  private errorFrom(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const details = error as { code?: unknown; message?: unknown };
      const code = typeof details.code === 'string' ? details.code.toLowerCase() : '';
      const message = typeof details.message === 'string' ? details.message : '';
      if (code === 'permission_denied' || code === 'permission-denied' || /permission[ _-]denied/i.test(message)) {
        return 'err.accessDenied';
      }
    }
    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }
    return 'err.generic';
  }
}
