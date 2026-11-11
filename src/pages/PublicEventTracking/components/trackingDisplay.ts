import type { TrackingCheckpoint, TrackingStatus } from '../types';

export const STATUS_MAP: Record<TrackingStatus, { label: string; color: string }> = {
  not_started: { label: '未开始', color: 'gray' },
  racing: { label: '比赛中', color: 'blue' },
  finished: { label: '已完赛', color: 'green' },
  dns: { label: 'DNS', color: 'orange' },
  dnf: { label: 'DNF', color: 'red' },
};

const formatNumber = (value: number) => (
  Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.?0+$/, '')
);

export const formatSegmentStats = (checkpoint: TrackingCheckpoint) => {
  const stats = [];
  if (checkpoint.segmentDistance !== null
    && checkpoint.segmentDistance !== undefined) {
    stats.push(`${formatNumber(checkpoint.segmentDistance)} km`);
  }
  if (checkpoint.segmentElevationGain !== null
    && checkpoint.segmentElevationGain !== undefined) {
    stats.push(`爬升 ${formatNumber(checkpoint.segmentElevationGain)} m`);
  }
  return stats.join(' · ');
};
