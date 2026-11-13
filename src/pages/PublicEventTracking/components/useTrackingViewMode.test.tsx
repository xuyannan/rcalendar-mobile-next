import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useTrackingViewMode from './useTrackingViewMode';

describe('tracking view preference', () => {
  it.each([null, 'garbage', '', 'list'])('defaults to list for %s', (saved) => {
    if (saved !== null) localStorage.setItem('event-tracking-view-mode', saved);
    const { result } = renderHook(useTrackingViewMode);
    expect(result.current[0]).toBe('list');
  });
  it('honors an explicit cards preference and persists changes across mounts', () => {
    localStorage.setItem('event-tracking-view-mode', 'cards');
    const { result, unmount } = renderHook(useTrackingViewMode);
    expect(result.current[0]).toBe('cards');
    act(() => result.current[1]('list'));
    expect(localStorage.getItem('event-tracking-view-mode')).toBe('list');
    unmount();
    expect(renderHook(useTrackingViewMode).result.current[0]).toBe('list');
  });
  it('works in memory when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const { result } = renderHook(useTrackingViewMode);
    expect(result.current[0]).toBe('list');
    act(() => result.current[1]('cards'));
    expect(result.current[0]).toBe('cards');
  });
});
