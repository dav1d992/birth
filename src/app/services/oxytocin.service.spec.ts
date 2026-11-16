import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { get, onValue, push, runTransaction, update } from 'firebase/database';
import type { DataSnapshot } from 'firebase/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_DB } from '../core/firebase';
import { AuthSessionService } from './auth-session.service';
import { OxytocinService } from './oxytocin.service';
import type { OxytocinItem, OxytocinListData } from '../models/oxytocin';

vi.mock('firebase/database', async (importOriginal) => {
  const { vi: mock } = await import('vitest');
  const original = await importOriginal<typeof import('firebase/database')>();
  return { ...original, ref: mock.fn(), get: mock.fn(), push: mock.fn(), update: mock.fn(), onValue: mock.fn(), runTransaction: mock.fn() };
});

describe('Encrypted realtime lists', () => {
  let service: OxytocinService;
  let payload: OxytocinListData;
  const a: OxytocinItem = { id: 'a', text: 'Calm', done: false };
  const b: OxytocinItem = { id: 'b', text: 'Warmth', done: false };
  const snapshot = (): DataSnapshot => ({ val: () => payload }) as DataSnapshot;

  beforeEach(async () => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [
      { provide: FIREBASE_DB, useValue: {} },
      { provide: AuthSessionService, useValue: { ensureUser: async () => ({ uid: 'test-user' }) } },
    ] });
    service = TestBed.inject(OxytocinService);
    vi.mocked(push).mockReturnValue({ key: 'test-list' } as ReturnType<typeof push>);
    vi.mocked(update).mockImplementation(async (_ref, updates) => {
      const values = updates as Record<string, unknown>;
      if (values['listData/test-list']) payload = values['listData/test-list'] as OxytocinListData;
    });
    vi.mocked(get).mockImplementation(async () => snapshot());
    vi.mocked(runTransaction).mockImplementation(async (_ref, mutation) => {
      const next = mutation(payload) as OxytocinListData | undefined;
      if (next) payload = next;
      return { committed: next !== undefined, snapshot: snapshot(), toJSON: () => ({}) };
    });
    await service.createList('Test', 'test-only-password');
    await service.saveItems('test-list', [a]);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('decrypts realtime events and detaches the Firebase listener', async () => {
    const unsubscribe = vi.fn();
    vi.mocked(onValue).mockImplementation((_ref, listener) => {
      queueMicrotask(() => listener(snapshot()));
      return unsubscribe;
    });
    expect(await firstValueFrom(service.watchItems('test-list'))).toEqual([a]);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('rebases a mutation if another client changes the encrypted list', async () => {
    const previous = payload;
    await service.saveItems('test-list', [a, b]);
    const concurrent = payload;
    payload = previous;
    vi.mocked(runTransaction).mockImplementationOnce(async (_ref, mutation) => {
      payload = concurrent;
      expect(mutation(payload)).toBeUndefined();
      return { committed: false, snapshot: snapshot(), toJSON: () => ({}) };
    });
    await service.mutateItems('test-list', (items) => items.map((item) => item.id === 'a' ? { ...item, text: 'Edited' } : item));
    vi.mocked(onValue).mockImplementation((_ref, listener) => {
      queueMicrotask(() => listener(snapshot()));
      return vi.fn();
    });
    expect(await firstValueFrom(service.watchItems('test-list'))).toEqual([{ ...a, text: 'Edited' }, b]);
    expect(runTransaction).toHaveBeenCalledTimes(2);
  });

  it('does not recreate a remotely deleted list', async () => {
    vi.mocked(get).mockResolvedValue({ val: () => null } as DataSnapshot);
    await expect(service.mutateItems('test-list', () => [a])).rejects.toThrow('err.notFound');
    expect(runTransaction).not.toHaveBeenCalled();
  });
});