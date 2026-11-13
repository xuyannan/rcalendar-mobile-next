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
  it('orders same-point arrivals by actual time, not cumulativeTime segment duration', () => {
    expect(ids([runner(1, { currentCheckpoint: checkpoint(4, { time: '12:08:15', cumulativeTime: '00:05:00' }) }),
      runner(2, { currentCheckpoint: checkpoint(4, { time: '11:04:40', cumulativeTime: '01:30:00' }) })])).toEqual([2, 1]);
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


describe('CNH-60 millisecond reports', () => {
  // The brief supplies order/names but not database/provider IDs. Stable fixture
  // IDs preserve the API relationship between group, current point and history.
  const checkpoints = Array.from({ length: 8 }, (_, order) => checkpoint(order, {
    id: 1000 + order,
    providerPointId: String(order),
    name: ['起点', 'CP1', 'CP2', 'CP3', 'CP4 里辽', 'CP5 峰山村', 'CP6 屠岙蔡', '终点'][order],
    pointType: order === 0 ? 'start' : order === 7 ? 'finish' : 'checkpoint',
  }));
  const trackedRunner = (bib: number, name: string, order: number, time: string, segmentTime: string) => {
    const current = { ...checkpoints[order], time, cumulativeTime: segmentTime };
    const history = checkpoints.map((point, index) => index === order ? current
      : index < order ? { ...point, time: index === 0 ? '06:00:02.039' : `${String(6 + index).padStart(2, '0')}:00:00.123` }
        : { ...point, prediction: '13:30:00.000', isPredicted: true });
    return runner(bib, { name, bibNumber: String(bib), currentCheckpoint: current,
      history, nextCheckpoint: history[order + 1] });
  };
  const cnhGroup = group(60, {
    name: 'CNH-60',
    startAt: '2026-11-13T06:00:00+08:00',
    checkpoints,
    runners: [
      trackedRunner(3130, '黄鹏程', 4, '11:04:40.312', '01:30:00'),
      trackedRunner(3162, '徐恺', 5, '11:34:07.055', '00:30:00'),
      trackedRunner(3599, '冯旭生', 4, '12:08:15.039', '00:05:00'),
      trackedRunner(3776, '裴树龙', 6, '12:17:38.149', '01:05:40'),
    ],
  });

  it('reproduces the four reported runners and sorts CP6, CP5, then CP4 arrival times', () => {
    expect(sortTrackingRunners(cnhGroup, 'Asia/Shanghai').map((r) => r.bibNumber))
      .toEqual(['3776', '3162', '3130', '3599']);
  });
  it('retains progress from millisecond history without a current point', () => {
    expect(sortTrackingRunners({ ...cnhGroup, runners: cnhGroup.runners.map((r) => ({ ...r, currentCheckpoint: null })) }, 'Asia/Shanghai').map((r) => r.bibNumber))
      .toEqual(['3776', '3162', '3130', '3599']);
  });
  it('uses milliseconds to break same-second ties, regardless of ID and segment duration', () => {
    expect(sortTrackingRunners({ ...cnhGroup, runners: [
      trackedRunner(3130, 'Later', 4, '11:04:40.312', '00:01:00'),
      trackedRunner(3599, 'Earlier', 4, '11:04:40.039', '01:30:00'),
    ] }, 'Asia/Shanghai').map((r) => r.id)).toEqual([3599, 3130]);
  });
  it('compares millisecond clock and dated arrivals on the same timeline', () => {
    expect(sortTrackingRunners({ ...cnhGroup, runners: [
      trackedRunner(3130, 'Clock', 4, '11:04:40.312', '00:01:00'),
      trackedRunner(3599, 'Dated', 4, '2026-11-13T11:04:40.039+08:00', '01:30:00'),
    ] }, 'Asia/Shanghai').map((r) => r.id)).toEqual([3599, 3130]);
  });
});
