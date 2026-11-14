import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { get, onValue, ref, remove, serverTimestamp, update } from 'firebase/database';
import type { DataSnapshot } from 'firebase/database';
import type { OxytocinListMeta, RateLimitState } from '../models/oxytocin';
import { FIREBASE_DB } from '../core/firebase';
import { AuthSessionService } from './auth-session.service';

const ADMIN_STORAGE_KEY = 'birth-admin';
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

export interface AdminListMeta {
  id: string;
  title: string;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  readonly #db = inject(FIREBASE_DB);
  readonly #authSession = inject(AuthSessionService);

  readonly isAdmin = signal<boolean>(localStorage.getItem(ADMIN_STORAGE_KEY) === '1');

  async login(code: string): Promise<void> {
    const trimmedCode: string = code.trim();
    if (trimmedCode.length === 0) {
      throw new Error('err.adminCodeRequired');
    }

    const user = await this.#authSession.ensureUser();
    const attemptPath: string = `adminAttempts/${user.uid}`;
    const attemptSnapshot = await get(ref(this.#db, attemptPath));
    const nextAttempt: RateLimitState = this.nextRateLimitState(attemptSnapshot.val() as RateLimitState | null);

    await update(ref(this.#db), {
      [attemptPath]: {
        count: nextAttempt.count,
        at: serverTimestamp(),
      },
      [`adminClaims/${user.uid}`]: trimmedCode,
    });

    try {
      await get(ref(this.#db, 'adminCheck'));
      this.isAdmin.set(true);
      localStorage.setItem(ADMIN_STORAGE_KEY, '1');
    } catch (error) {
      if (this.isPermissionDenied(error)) {
        this.isAdmin.set(false);
        localStorage.setItem(ADMIN_STORAGE_KEY, '0');
        throw new Error('err.wrongAdminCode');
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    const user = await this.#authSession.ensureUser();
    await remove(ref(this.#db, `adminClaims/${user.uid}`));
    this.isAdmin.set(false);
    localStorage.setItem(ADMIN_STORAGE_KEY, '0');
  }

  watchListMeta(): Observable<Array<AdminListMeta>> {
    return new Observable<Array<AdminListMeta>>((subscriber) => {
      const unsubscribe = onValue(
        ref(this.#db, 'listMeta'),
        (snapshot: DataSnapshot): void => {
          const value = snapshot.val() as Record<string, OxytocinListMeta> | null;
          if (value === null) {
            subscriber.next([]);
            return;
          }

          const records = Object.entries(value)
            .map(([id, meta]: [string, OxytocinListMeta]): AdminListMeta => {
              return {
                id,
                title: meta.title,
                createdAt: Number(meta.createdAt ?? 0),
              };
            })
            .sort((a: AdminListMeta, b: AdminListMeta): number => b.createdAt - a.createdAt);

          subscriber.next(records);
        },
        (error: unknown): void => {
          subscriber.error(error);
        }
      );

      return (): void => {
        unsubscribe();
      };
    });
  }

  async deleteList(listId: string): Promise<void> {
    await update(ref(this.#db), {
      [`listMeta/${listId}`]: null,
      [`listSecrets/${listId}`]: null,
      [`listData/${listId}`]: null,
      [`listClaims/${listId}`]: null,
      [`listAttempts/${listId}`]: null,
    });
  }

  private nextRateLimitState(previous: RateLimitState | null): RateLimitState {
    const now: number = Date.now();
    if (previous === null || now - previous.at > RATE_LIMIT_WINDOW_MS) {
      return { count: 1, at: now };
    }

    if (previous.count >= MAX_ATTEMPTS) {
      throw new Error('err.rateLimited');
    }

    return {
      count: previous.count + 1,
      at: now,
    };
  }

  private isPermissionDenied(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const value = error as { code?: string };
    return value.code === 'PERMISSION_DENIED' || value.code === 'permission-denied';
  }
}
