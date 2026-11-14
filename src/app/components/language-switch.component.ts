import { Component, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-language-switch',
  standalone: true,
  templateUrl: './language-switch.component.html',
  styleUrl: './language-switch.component.scss',
})
export class LanguageSwitchComponent {
  readonly i18n = inject(I18nService);

  setLang(lang: 'da' | 'en'): void {
    this.i18n.setLang(lang);
  }
}
