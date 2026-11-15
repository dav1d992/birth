import { Component, ElementRef, inject, signal } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-admin-lock',
  standalone: true,
  templateUrl: './admin-lock.component.html',
  styleUrl: './admin-lock.component.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class AdminLockComponent {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly i18n = inject(I18nService);
  readonly admin = inject(AdminService);
  readonly open = signal<boolean>(false);
  readonly code = signal<string>('');
  readonly errorKey = signal<string>('');
  readonly busy = signal<boolean>(false);

  toggle(): void {
    this.open.update((value: boolean): boolean => !value);
    this.errorKey.set('');
  }

  close(): void {
    this.open.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (event.target instanceof Node && !this.#host.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  onCodeInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.code.set(target.value);
  }

  async login(event: Event): Promise<void> {
    event.preventDefault();
    this.errorKey.set('');
    this.busy.set(true);

    try {
      await this.admin.login(this.code());
      this.code.set('');
      this.close();
    } catch (error) {
      this.errorKey.set(error instanceof Error && error.message.length > 0 ? error.message : 'err.generic');
    } finally {
      this.busy.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.admin.logout();
    this.close();
  }
}
