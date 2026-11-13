import type { PublicTrackingGroup, PublicTrackingRunner, TrackingCheckpoint } from '../pages/PublicEventTracking/types';

export const checkpoint = (order: number, overrides: Partial<TrackingCheckpoint> = {}): TrackingCheckpoint => ({
  id: order, name: `CP${order}`, pointType: 'checkpoint', sortOrder: order, ...overrides,
});
export const runner = (id: number, overrides: Partial<PublicTrackingRunner> = {}): PublicTrackingRunner => ({
  id, eventGroupId: 1, bibNumber: String(id), name: `Runner ${id}`, nickname: '',
  status: 'racing', currentCheckpoint: null, nextCheckpoint: null, history: [], ...overrides,
});
export const group = (id: number, overrides: Partial<PublicTrackingGroup> = {}): PublicTrackingGroup => ({
  id, name: `Group ${id}`, checkpoints: [checkpoint(3), checkpoint(4), checkpoint(5, { pointType: 'finish', name: 'Finish' })],
  runners: [], ...overrides,
});
export const raceStart = '2026-11-13T00:00:00Z';
