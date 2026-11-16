import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OxytocinListPageComponent } from './oxytocin-list-page.component';
import { OxytocinService } from '../services/oxytocin.service';
import type { OxytocinItem } from '../models/oxytocin';

describe('Oxytocin list editing', () => {
  const first: OxytocinItem = { id: 'a', text: 'Calm', done: false };
  const second: OxytocinItem = { id: 'b', text: 'Warmth', done: false };
  let remote: Subject<Array<OxytocinItem>>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let saved: Array<OxytocinItem>;
  let component: OxytocinListPageComponent;
  let mutate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    remote = new Subject();
    params = new BehaviorSubject(convertToParamMap({ id: 'test-list' }));
    saved = [first, second];
    mutate = vi.fn(async (_id: string, mutation: (items: Array<OxytocinItem>) => Array<OxytocinItem>) => {
      saved = mutation(saved);
      remote.next(saved);
    });
    await TestBed.configureTestingModule({
      imports: [OxytocinListPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        { provide: OxytocinService, useValue: {
          watchListMeta: () => of({ title: 'Test list' }),
          unlockList: async () => saved,
          watchItems: () => remote,
          mutateItems: mutate,
        } },
      ],
    }).overrideComponent(OxytocinListPageComponent, { set: { template: '' } }).compileComponents();
    component = TestBed.createComponent(OxytocinListPageComponent).componentInstance;
    await component.unlock();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  function type(id: string, value: string): void {
    const input = document.createElement('textarea');
    input.value = value;
    input.addEventListener('input', (event) => component.onItemTextInput(id, event));
    input.dispatchEvent(new Event('input'));
  }

  it('keeps typing local until submitted and clears the saved draft', async () => {
    type('a', 'Quiet room');
    expect(mutate).not.toHaveBeenCalled();
    expect(component.items()[0].text).toBe('Calm');
    await component.submitItem(first);
    expect(saved[0].text).toBe('Quiet room');
    expect(component.drafts()['a']).toBeUndefined();
  });

  it('receives remote order and content without overwriting a local draft', () => {
    type('a', 'Still typing');
    remote.next([second, { ...first, text: 'Remote edit' }]);
    expect(component.items().map((item) => item.id)).toEqual(['b', 'a']);
    expect(component.items()[1].text).toBe('Remote edit');
    expect(component.drafts()['a']).toBe('Still typing');
    expect(mutate).not.toHaveBeenCalled();
  });

  it('does not publish new empty points and preserves them during updates', async () => {
    component.addItem();
    const pending = component.items()[2];
    await component.submitItem(pending);
    expect(mutate).not.toHaveBeenCalled();
    remote.next([second, first]);
    expect(component.items()[2].id).toBe(pending.id);
    type(pending.id, 'New point');
    await component.submitItem(pending);
    expect(saved.at(-1)?.text).toBe('New point');
    expect(component.isPending(pending.id)).toBe(false);
  });

  it('moves immediately and persists the order', async () => {
    component.moveDown(0);
    expect(component.items().map((item) => item.id)).toEqual(['b', 'a']);
    await vi.waitFor(() => expect(component.busy()).toBe(false));
    expect(saved.map((item) => item.id)).toEqual(['b', 'a']);
  });

  it('rolls back ordering on failure and retains unsaved text', async () => {
    type('a', 'Keep this draft');
    mutate.mockRejectedValueOnce(new Error('err.generic'));
    component.moveDown(0);
    await vi.waitFor(() => expect(component.busy()).toBe(false));
    expect(component.items().map((item) => item.id)).toEqual(['a', 'b']);
    expect(component.drafts()['a']).toBe('Keep this draft');
    expect(component.errorKey()).toBe('err.generic');
  });

  it('unsubscribes and clears drafts on route changes', () => {
    type('a', 'Draft');
    params.next(convertToParamMap({ id: 'another-list' }));
    remote.next([second]);
    expect(component.items()).toEqual([]);
    expect(component.drafts()).toEqual({});
    expect(component.unlocked()).toBe(false);
  });
});