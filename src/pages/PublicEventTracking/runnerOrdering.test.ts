import { describe, expect, it } from 'vitest';
import { filterTrackingRunners, sortTrackingRunners } from './runnerOrdering';
import { checkpoint, group, raceStart, runner } from '../../test/trackingFixtures';
import type { PublicTrackingRunner } from './types';

const ids = (runners: PublicTrackingRunner[]) => sortTrackingRunners(group(1, { runners, startAt: raceStart })).map((r) => r.id);
describe('runner progress', () => {
  it('puts CP4 ahead of CP3 and earlier CP4 arrivals first', () => {
    expect(ids([
      runner(1, { currentCheckpoint: checkpoint(3, { time: '08:00:00' }) }),
      runner(2, { currentCheckpoint: checkpoint(4, { time: '10:00:00' }) }),
      runner(3, { currentCheckpoint: checkpoint(4, { time: '09:00:00' }) }),
    ])).toEqual([3, 2, 1]);
  });
  it('uses history as well as current point, never counts a prediction or next point', () => {
    expect(ids([
      runner(1, { currentCheckpoint: checkpoint(5, { prediction: '10:00:00', isPredicted: true }), history: [checkpoint(3, { time: '08:00:00' })] }),
      runner(2, { history: [checkpoint(4, { time: '09:00:00' })] }),
      runner(3, { nextCheckpoint: checkpoint(5, { time: '08:00:00' }) }),
    ])).toEqual([2, 1, 3]);
  });
  it('ranks actual finish reports and finished statuses first, early finishes first', () => {
    expect(ids([
      runner(1, { currentCheckpoint: checkpoint(4, { time: '08:00:00' }) }),
      runner(2, { status: 'finished', history: [checkpoint(5, { time: '12:00:00' })] }),
      runner(3, { history: [checkpoint(5, { time: '11:00:00' })] }),
      runner(4, { status: 'finished' }),
    ])).toEqual([3, 2, 4, 1]);
  });
  it('recognizes finish point metadata outside the group checkpoint array', () => {
    expect(ids([runner(1, { currentCheckpoint: checkpoint(4, { time: '09:00:00' }) }),
      runner(2, { currentCheckpoint: checkpoint(9, { pointType: 'finish', time: '10:00:00' }) })])).toEqual([2, 1]);
  });
  it('puts no actual progress behind racers and DNS/DNF behind active racers', () => {
    expect(ids([runner(1, { status: 'not_started' }), runner(2, { status: 'dnf', currentCheckpoint: checkpoint(4, { time: '08:00:00' }) }),
      runner(3, { currentCheckpoint: checkpoint(3, { time: '09:00:00' }) }), runner(4, { status: 'dns' })])).toEqual([3, 1, 2, 4]);
  });
  it('compares dated and time-only reports on the same timeline', () => {
    expect(ids([runner(1, { currentCheckpoint: checkpoint(4, { time: '10:00:00' }) }),
      runner(2, { currentCheckpoint: checkpoint(4, { time: '2026-11-13T09:30:00Z' }) }),
      runner(3, { currentCheckpoint: checkpoint(4, { time: '2026-11-13T17:00:00+08:00' }) })])).toEqual([3, 2, 1]);
  });
  it('rolls time-only reports forward across midnight from the race start', () => {
    const runners = [runner(1, { currentCheckpoint: checkpoint(4, { time: '00:15:00' }) }),
      runner(2, { currentCheckpoint: checkpoint(4, { time: '23:30:00' }) })];
    expect(sortTrackingRunners(group(1, { runners, startAt: '2026-11-13T22:00:00Z' })).map((r) => r.id)).toEqual([2, 1]);
  });
  it('uses cumulative durations to disambiguate multi-day time-only reports', () => {
    expect(ids([runner(1, { currentCheckpoint: checkpoint(4, { time: '01:00:00', cumulativeTime: '25:00:00' }) }),
      runner(2, { currentCheckpoint: checkpoint(4, { time: '23:00:00', cumulativeTime: '23:00:00' }) })])).toEqual([2, 1]);
  });
  it('uses canonical checkpoint ordering even if reports carry stale sort orders', () => {
    expect(ids([runner(1, { currentCheckpoint: checkpoint(3, { time: '09:00:00', sortOrder: 100 }) }),
      runner(2, { currentCheckpoint: checkpoint(4, { time: '10:00:00', sortOrder: 0 }) })])).toEqual([2, 1]);
  });
  it('falls back to the group checkpoint array when sortOrder is unavailable', () => {
    const runners = [runner(1, { currentCheckpoint: checkpoint(3, { time: '09:00:00', sortOrder: NaN }) }),
      runner(2, { currentCheckpoint: checkpoint(4, { time: '10:00:00', sortOrder: NaN }) })];
    expect(sortTrackingRunners(group(1, { runners, checkpoints: [checkpoint(3, { sortOrder: NaN }), checkpoint(4, { sortOrder: NaN })] })).map((r) => r.id)).toEqual([2, 1]);
  });
  it('ignores invalid actual times and uses stable ID ties without mutating data', () => {
    const runners = [runner(2), runner(1, { currentCheckpoint: checkpoint(4, { time: '25:99:99' }) })];
    const before = structuredClone(runners);
    expect(ids(runners)).toEqual([1, 2]);
    expect(runners).toEqual(before);
  });
});

describe('group-local filtering', () => {
  const runners = [runner(1, { name: 'Alice Smith', nickname: '小鹿', bibNumber: '5832' }), runner(2, { name: 'Bob', nickname: 'Falcon', bibNumber: '9000' })];
  it.each([[' aliCE ', [1]], ['小鹿', [1]], [' FAL ', [2]], ['58', [1]], ['  ', [1, 2]], ['missing', []]])('matches %s by name, nickname or bib', (query, expected) => {
    expect(filterTrackingRunners(runners, query).map((r) => r.id)).toEqual(expected);
  });
  it('preserves progress order after filtering and clearing', () => {
    const sorted = sortTrackingRunners(group(1, { runners: [runner(1, { name: 'Alice', currentCheckpoint: checkpoint(3, { time: '08:00:00' }) }), runner(2, { name: 'Alice Fast', currentCheckpoint: checkpoint(4, { time: '09:00:00' }) })] }));
    expect(filterTrackingRunners(sorted, 'alice').map((r) => r.id)).toEqual([2, 1]);
    expect(filterTrackingRunners(sorted, '').map((r) => r.id)).toEqual([2, 1]);
  });
});
