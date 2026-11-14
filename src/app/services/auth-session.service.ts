import { Injectable, inject } from '@angular/core';
import { signInAnonymously } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { FIREBASE_AUTH } from '../core/firebase';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  readonly #auth = inject(FIREBASE_AUTH);

  async ensureUser(): Promise<User> {
    const existing: User | null = this.#auth.currentUser;
    if (existing !== null) {
      return existing;
    }

    const credential = await signInAnonymously(this.#auth);
    return credential.user;
  }
}
