import { describe, expect, it } from 'vitest';
import { getGroupState, sortTrackingGroups } from './utils';
import { group } from '../../test/trackingFixtures';
import { parseTrackingDate } from './trackingTime';

const now = Date.parse('2026-11-13T04:00:00Z');
describe('group order and state', () => {
  it('orders ongoing, upcoming, finished, unknown without mutating the input', () => {
    const groups = [group(4), group(3, { startAt: '2026-11-12T01:00:00Z', closeAt: '2026-11-13T03:00:00Z' }),
      group(2, { startAt: '2026-11-13T05:00:00Z' }), group(1, { startAt: '2026-11-13T01:00:00Z' })];
    expect(sortTrackingGroups(groups, now).map((g) => g.id)).toEqual([1, 2, 3, 4]);
    expect(groups.map((g) => g.id)).toEqual([4, 3, 2, 1]);
  });
  it('sorts equal states by start time and uses IDs for ties', () => {
    const groups = [group(2, { startAt: '2026-11-13T02:00:00Z' }), group(3, { startAt: '2026-11-13T01:00:00Z' }), group(1, { startAt: '2026-11-13T01:00:00Z' })];
    expect(sortTrackingGroups(groups, now).map((g) => g.id)).toEqual([1, 3, 2]);
  });
  it('uses event timezone for bare dates, and honors explicit offsets', () => {
    expect(getGroupState(group(1, { startAt: '2026-11-13 11:00:00' }), now, 'Asia/Shanghai')).toBe('ongoing');
    expect(getGroupState(group(1, { startAt: '2026-11-13 11:00:00' }), now, 'Europe/Paris')).toBe('upcoming');
    expect(getGroupState(group(1, { startAt: '2026-11-13T11:00:00+08:00' }), now, 'Europe/Paris')).toBe('ongoing');
  });
  it('keeps started groups ongoing without a close time', () => {
    expect(getGroupState(group(1, { startAt: '2026-11-01T00:00:00Z' }), now)).toBe('ongoing');
  });
  it('falls back from invalid canonical dates to local or Beijing dates', () => {
    expect(getGroupState(group(1, { startAt: 'bad', startAtLocal: '2026-11-13 11:00:00' }), now, 'Asia/Shanghai')).toBe('ongoing');
    expect(getGroupState(group(1, { startAt: 'bad', startAtBeijing: '2026-11-13 11:00:00' }), now, 'Europe/Paris')).toBe('ongoing');
    expect(getGroupState(group(1, { closeAt: 'bad', closeAtBeijing: '2026-11-13 11:00:00' }), now)).toBe('finished');
  });
  it('handles boundary times and unusable timestamps deterministically', () => {
    expect(getGroupState(group(1, { startAt: new Date(now).toISOString() }), now)).toBe('ongoing');
    expect(getGroupState(group(1, { closeAt: new Date(now).toISOString() }), now)).toBe('finished');
    expect(getGroupState(group(1, { startAt: 'invalid' }), now)).toBe('unknown');
    expect(getGroupState(group(1, { startAt: '2026-02-30T00:00:00Z' }), now)).toBe('unknown');
  });
  it('rejects malformed dates, clock fields, and invalid timezones', () => {
    for (const value of ['2026-13-01', '2026-11-13T25:00:00Z', '2026-11-13T00:60:00Z', '08:00:00', '']) {
      expect(parseTrackingDate(value)).toBeNull();
    }
    expect(parseTrackingDate('2026-11-13 11:00:00', 'Not/AZone')).toBeNull();
  });
});
