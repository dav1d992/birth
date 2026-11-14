import { Component, DestroyRef, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LanguageSwitchComponent } from './components/language-switch.component';
import { I18nService } from './services/i18n.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LanguageSwitchComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  readonly i18n = inject(I18nService);
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
        this.updateTitle();
      });

    effect(() => {
      this.i18n.lang();
      this.updateTitle();
    });
  }

  private updateTitle(): void {
    let route: ActivatedRoute = this.#route;

    while (route.firstChild !== null) {
      route = route.firstChild;
    }

    const titleKey: string = String(route.snapshot.data['titleKey'] ?? 'app.name');
    this.#title.setTitle(this.i18n.t(titleKey));
  }
}
