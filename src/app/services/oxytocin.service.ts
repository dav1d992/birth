import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { get, onValue, push, ref, serverTimestamp, update } from 'firebase/database';
import type { DataSnapshot } from 'firebase/database';
import { FIREBASE_DB } from '../core/firebase';
import { AuthSessionService } from './auth-session.service';
import type { OxytocinItem, OxytocinListData, OxytocinListMeta, RateLimitState, RememberedList } from '../models/oxytocin';

const LIST_STORAGE_KEY = 'birth-lists';
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

@Injectable({ providedIn: 'root' })
export class OxytocinService {
  readonly #db = inject(FIREBASE_DB);
  readonly #authSession = inject(AuthSessionService);

  readonly activeListId = signal<string | null>(null);
  readonly activeTitle = signal<string>('');
  readonly items = signal<Array<OxytocinItem>>([]);

  #activeKey: CryptoKey | null = null;

  watchListMeta(listId: string): Observable<OxytocinListMeta | null> {
    return new Observable<OxytocinListMeta | null>((subscriber) => {
      const dbRef = ref(this.#db, `listMeta/${listId}`);
      const unsubscribe = onValue(
        dbRef,
        (snapshot: DataSnapshot): void => {
          const value = snapshot.val() as OxytocinListMeta | null;
          subscriber.next(value);
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

  readRememberedLists(): Array<RememberedList> {
    const raw: string | null = localStorage.getItem(LIST_STORAGE_KEY);
    if (raw === null) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Array<RememberedList>;
      return parsed.filter((entry: RememberedList): boolean => entry.id.length > 0 && entry.title.length > 0);
    } catch {
      return [];
    }
  }

  async createList(title: string, password: string): Promise<string> {
    const safeTitle: string = title.trim();
    if (password.length < 8) {
      throw new Error('err.passwordTooShort');
    }
    if (safeTitle.length === 0) {
      throw new Error('err.generic');
    }

    const user = await this.#authSession.ensureUser();
    const listId: string = push(ref(this.#db, 'listMeta')).key ?? '';
    if (listId.length === 0) {
      throw new Error('err.generic');
    }

    const saltBytes: Uint8Array = crypto.getRandomValues(new Uint8Array(16));
    const salt: string = this.uint8ToBase64(saltBytes);
    const verifier: string = await this.deriveVerifier(password, salt);
    const key: CryptoKey = await this.deriveAesKey(password, salt);
    const encrypted: OxytocinListData = await this.encryptItems(key, []);

    const updates: Record<string, unknown> = {
      [`listMeta/${listId}`]: {
        title: safeTitle,
        salt,
        createdAt: serverTimestamp(),
      },
      [`listSecrets/${listId}`]: verifier,
      [`listAttempts/${listId}/${user.uid}`]: {
        count: 1,
        at: serverTimestamp(),
      },
      [`listClaims/${listId}/${user.uid}`]: verifier,
      [`listData/${listId}`]: {
        iv: encrypted.iv,
        ct: encrypted.ct,
        updatedAt: serverTimestamp(),
      },
    };

    await update(ref(this.#db), updates);

    this.#activeKey = key;
    this.activeListId.set(listId);
    this.activeTitle.set(safeTitle);
    this.items.set([]);
    this.rememberList({ id: listId, title: safeTitle });

    return listId;
  }

  async unlockList(listId: string, password: string): Promise<Array<OxytocinItem>> {
    const user = await this.#authSession.ensureUser();
    const metaSnapshot = await get(ref(this.#db, `listMeta/${listId}`));
    const meta = metaSnapshot.val() as OxytocinListMeta | null;
    if (meta === null) {
      throw new Error('err.notFound');
    }

    const verifier: string = await this.deriveVerifier(password, meta.salt);
    const key: CryptoKey = await this.deriveAesKey(password, meta.salt);

    const rateLimitPath: string = `listAttempts/${listId}/${user.uid}`;
    const previousAttempt = await get(ref(this.#db, rateLimitPath));
    const nextAttempt: RateLimitState = this.nextRateLimitState(previousAttempt.val() as RateLimitState | null);

    const unlockUpdate: Record<string, unknown> = {
      [rateLimitPath]: {
        count: nextAttempt.count,
        at: serverTimestamp(),
      },
      [`listClaims/${listId}/${user.uid}`]: verifier,
    };

    await update(ref(this.#db), unlockUpdate);

    try {
      const dataSnapshot = await get(ref(this.#db, `listData/${listId}`));
      const payload = dataSnapshot.val() as OxytocinListData | null;
      if (payload === null) {
        throw new Error('err.notFound');
      }

      const decrypted = await this.decryptItems(key, payload);
      this.#activeKey = key;
      this.activeListId.set(listId);
      this.activeTitle.set(meta.title);
      this.items.set(decrypted);
      this.rememberList({ id: listId, title: meta.title });

      return decrypted;
    } catch (error) {
      if (this.isPermissionDenied(error)) {
        throw new Error('err.wrongPassword');
      }
      throw error;
    }
  }

  async saveItems(listId: string, items: Array<OxytocinItem>): Promise<void> {
    if (this.#activeKey === null || this.activeListId() !== listId) {
      throw new Error('err.locked');
    }

    const encrypted: OxytocinListData = await this.encryptItems(this.#activeKey, items);
    await update(ref(this.#db), {
      [`listData/${listId}`]: {
        iv: encrypted.iv,
        ct: encrypted.ct,
        updatedAt: serverTimestamp(),
      },
    });
    this.items.set(items);
  }

  async deleteList(listId: string): Promise<void> {
    await this.#authSession.ensureUser();
    await update(ref(this.#db), {
      [`listMeta/${listId}`]: null,
      [`listSecrets/${listId}`]: null,
      [`listData/${listId}`]: null,
      [`listClaims/${listId}`]: null,
      [`listAttempts/${listId}`]: null,
    });

    if (this.activeListId() === listId) {
      this.activeListId.set(null);
      this.activeTitle.set('');
      this.items.set([]);
      this.#activeKey = null;
    }

    const filtered = this.readRememberedLists().filter((entry: RememberedList): boolean => entry.id !== listId);
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(filtered));
  }

  private rememberList(entry: RememberedList): void {
    const existing = this.readRememberedLists().filter((item: RememberedList): boolean => item.id !== entry.id);
    existing.unshift(entry);
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(existing.slice(0, 20)));
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

  private async deriveVerifier(password: string, salt: string): Promise<string> {
    const bytes: ArrayBuffer = await this.deriveBits(password, `${salt}|verify`);
    return this.arrayBufferToHex(bytes);
  }

  private async deriveAesKey(password: string, salt: string): Promise<CryptoKey> {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(`${salt}|encrypt`),
        iterations: 210000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async deriveBits(password: string, salt: string): Promise<ArrayBuffer> {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    return crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: 210000,
        hash: 'SHA-256',
      },
      passwordKey,
      256
    );
  }

  private async encryptItems(key: CryptoKey, items: Array<OxytocinItem>): Promise<OxytocinListData> {
    const ivBytes = crypto.getRandomValues(new Uint8Array(12));
    const plainTextView: Uint8Array = new TextEncoder().encode(JSON.stringify(items));
    const plainText: ArrayBuffer = plainTextView.buffer.slice(
      plainTextView.byteOffset,
      plainTextView.byteOffset + plainTextView.byteLength
    ) as ArrayBuffer;
    const iv: ArrayBuffer = ivBytes.buffer.slice(ivBytes.byteOffset, ivBytes.byteOffset + ivBytes.byteLength) as ArrayBuffer;
    const cipherText: ArrayBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      plainText
    );

    return {
      iv: this.uint8ToBase64(ivBytes),
      ct: this.arrayBufferToBase64(cipherText),
      updatedAt: Date.now(),
    };
  }

  private async decryptItems(key: CryptoKey, data: OxytocinListData): Promise<Array<OxytocinItem>> {
    const ivBytes: Uint8Array = this.base64ToUint8(data.iv);
    const ctBytes: Uint8Array = this.base64ToUint8(data.ct);
    const iv: ArrayBuffer = ivBytes.buffer.slice(ivBytes.byteOffset, ivBytes.byteOffset + ivBytes.byteLength) as ArrayBuffer;
    const ct: ArrayBuffer = ctBytes.buffer.slice(ctBytes.byteOffset, ctBytes.byteOffset + ctBytes.byteLength) as ArrayBuffer;
    const plainText = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ct
    );

    const decoded: unknown = JSON.parse(new TextDecoder().decode(plainText));
    if (!Array.isArray(decoded)) {
      return [];
    }

    return decoded
      .filter((item: unknown): boolean => {
        if (typeof item !== 'object' || item === null) {
          return false;
        }
        const candidate = item as Record<string, unknown>;
        return typeof candidate['id'] === 'string' && typeof candidate['text'] === 'string' && typeof candidate['done'] === 'boolean';
      })
      .map((item: unknown): OxytocinItem => {
        const candidate = item as Record<string, unknown>;
        return {
          id: String(candidate['id']),
          text: String(candidate['text']),
          done: Boolean(candidate['done']),
        };
      });
  }

  private uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let index = 0; index < bytes.byteLength; index += 1) {
      binary += String.fromCharCode(bytes[index] ?? 0);
    }
    return btoa(binary);
  }

  private base64ToUint8(value: string): Uint8Array {
    const binary: string = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  private arrayBufferToBase64(value: ArrayBuffer): string {
    return this.uint8ToBase64(new Uint8Array(value));
  }

  private arrayBufferToHex(value: ArrayBuffer): string {
    return Array.from(new Uint8Array(value))
      .map((byte: number): string => byte.toString(16).padStart(2, '0'))
      .join('');
  }
}
