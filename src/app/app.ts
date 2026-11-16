import { Component, DestroyRef, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminLockComponent } from './components/admin-lock.component';
import { LanguageSwitchComponent } from './components/language-switch.component';
import { I18nService } from './services/i18n.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LanguageSwitchComponent, AdminLockComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  readonly i18n = inject(I18nService);
  readonly isListPage = signal(false);
  readonly leaveDialog = viewChild<ElementRef<HTMLDialogElement>>('leaveDialog');
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #title = inject(Title);
  readonly #destroyRef = inject(DestroyRef);

  constructor() {
    this.#router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe(() => {
        this.closeLeaveDialog();
        this.updateTitle();
      });

    effect(() => {
      this.i18n.lang();
      this.updateTitle();
    });
  }

  viewTimeline(): void {
    this.leaveDialog()?.nativeElement.showModal();
  }

  closeLeaveDialog(): void {
    this.leaveDialog()?.nativeElement.close();
  }

  async confirmViewTimeline(): Promise<void> {
    this.closeLeaveDialog();
    await this.#router.navigate(['/']);
  }

  private updateTitle(): void {
    let route: ActivatedRoute = this.#route;

    while (route.firstChild !== null) {
      route = route.firstChild;
    }

    this.isListPage.set(route.snapshot.routeConfig?.path === 'oxytocin/:id');
    const titleKey: string = String(route.snapshot.data['titleKey'] ?? 'app.name');
    this.#title.setTitle(this.i18n.t(titleKey));
  }
}
