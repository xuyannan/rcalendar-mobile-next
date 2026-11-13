import type { PublicTrackingGroup, PublicTrackingRunner, TrackingCheckpoint } from './types';
import { clockSeconds, clockTimestamp, groupTimestamp, parseTrackingDate, trackingDayStart } from './trackingTime';

export const filterTrackingRunners = (runners: PublicTrackingRunner[], query: string) => {
  const needle = query.trim().toLocaleLowerCase();
  return runners.filter((runner) => [runner.name, runner.nickname, runner.bibNumber]
    .some((value) => value.toLocaleLowerCase().includes(needle)));
};

const isFinish = (point: TrackingCheckpoint) => (
  /^(finish|end|终点)$/i.test(point.pointType.trim())
  || /^(finish|终点)$/i.test(point.name.trim())
);

export const sortTrackingRunners = (group: PublicTrackingGroup, eventTimezone = 'UTC') => {
  const start = groupTimestamp(group, 'startAt', eventTimezone);
  const reports = (runner: PublicTrackingRunner) => [
    ...runner.history,
    ...(runner.currentCheckpoint ? [runner.currentCheckpoint] : []),
  ];
  const datedReports = group.runners.flatMap(reports)
    .map((point) => parseTrackingDate(point.time, eventTimezone))
    .filter((time): time is number => time !== null);
  const anchor = start ?? (datedReports.length ? trackingDayStart(Math.min(...datedReports), eventTimezone) : null);

  const progress = (runner: PublicTrackingRunner) => {
    const actual = reports(runner).flatMap((point) => {
      if (!point.time?.trim()) return [];
      const canonicalIndex = group.checkpoints.findIndex((candidate) => (
        candidate.id === point.id
        || (candidate.providerPointId != null && point.providerPointId != null
          && String(candidate.providerPointId) === String(point.providerPointId))
      ));
      const canonical = group.checkpoints[canonicalIndex];
      const order = Number.isFinite(canonical?.sortOrder) ? canonical.sortOrder
        : Number.isFinite(point.sortOrder) ? point.sortOrder : canonicalIndex;
      const clock = clockSeconds(point.time);
      // cumulativeTime can be a segment duration, not elapsed time from the start.
      const arrival = parseTrackingDate(point.time, eventTimezone)
        ?? (clock !== null ? clockTimestamp(clock, anchor, eventTimezone) : null);
      if (arrival === null) return [];
      return [{ order, arrival, finish: isFinish(canonical || point) || isFinish(point) }];
    }).sort((a, b) => Number(b.finish) - Number(a.finish)
      || b.order - a.order || a.arrival - b.arrival);
    const latest = actual[0];
    // Withdrawn/non-starters never appear to lead active racers.
    const tier = runner.status === 'dns' || runner.status === 'dnf' ? 3
      : runner.status === 'finished' || latest?.finish ? 0
        : latest ? 1 : 2;
    return {
      runner,
      tier,
      order: latest?.order ?? -1,
      // A finished status without a finish report has unknown finish time.
      arrival: tier === 0 && !latest?.finish ? Infinity : latest?.arrival ?? Infinity,
    };
  };

  return group.runners.map(progress).sort((a, b) => (
    a.tier - b.tier
    || (a.tier === 0 ? 0 : b.order - a.order)
    || (a.arrival === b.arrival ? 0 : a.arrival - b.arrival)
    || a.runner.id - b.runner.id
  )).map(({ runner }) => runner);
};
