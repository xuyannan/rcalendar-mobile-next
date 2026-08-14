import dayjs from 'dayjs';
import type {
  LocalTrackingEntry,
  PublicTrackingGroup,
  TrackingCheckpoint,
} from './types';

const STORAGE_PREFIX = 'public-event-tracking:';

export type GroupState = 'ongoing' | 'upcoming' | 'finished' | 'unknown';

export const getStorageKey = (eventId: string) =>
  `${STORAGE_PREFIX}${eventId}`;

export const readLocalTracking = (eventId: string): LocalTrackingEntry[] => {
  try {
    const raw = localStorage.getItem(getStorageKey(eventId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is LocalTrackingEntry => (
      typeof item === 'object'
      && item !== null
      && Number.isFinite((item as LocalTrackingEntry).runnerId)
      && Number.isFinite((item as LocalTrackingEntry).eventGroupId)
      && typeof (item as LocalTrackingEntry).bibNumber === 'string'
    )).map((item) => ({
      runnerId: item.runnerId,
      eventGroupId: item.eventGroupId,
      bibNumber: item.bibNumber,
      nickname: item.nickname || '',
    }));
  } catch {
    return [];
  }
};

export const writeLocalTracking = (
  eventId: string,
  entries: LocalTrackingEntry[],
) => {
  if (entries.length === 0) {
    localStorage.removeItem(getStorageKey(eventId));
    return;
  }
  localStorage.setItem(getStorageKey(eventId), JSON.stringify(entries));
};

export const upsertLocalTracking = (
  entries: LocalTrackingEntry[],
  next: LocalTrackingEntry,
) => [
  ...entries.filter((entry) => entry.runnerId !== next.runnerId),
  next,
];

const timestamp = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.valueOf() : null;
};

export const getGroupState = (
  group: PublicTrackingGroup,
  now = Date.now(),
): GroupState => {
  const start = timestamp(group.startAt);
  const close = timestamp(group.closeAt);

  if (start !== null && start > now) {
    return 'upcoming';
  }
  if (close !== null && close <= now) {
    return 'finished';
  }
  if (start !== null && start <= now && (close === null || close > now)) {
    return 'ongoing';
  }
  return 'unknown';
};

const GROUP_STATE_ORDER: Record<GroupState, number> = {
  ongoing: 0,
  upcoming: 1,
  finished: 2,
  unknown: 3,
};

export const sortTrackingGroups = (
  groups: PublicTrackingGroup[],
  now = Date.now(),
) => [...groups].sort((left, right) => {
  const leftState = getGroupState(left, now);
  const rightState = getGroupState(right, now);
  const stateDifference = (
    GROUP_STATE_ORDER[leftState] - GROUP_STATE_ORDER[rightState]
  );
  if (stateDifference !== 0) {
    return stateDifference;
  }

  const leftStart = timestamp(left.startAt) ?? Number.MAX_SAFE_INTEGER;
  const rightStart = timestamp(right.startAt) ?? Number.MAX_SAFE_INTEGER;
  return leftStart - rightStart || left.id - right.id;
});

export const groupStateLabel: Record<GroupState, string> = {
  ongoing: '进行中',
  upcoming: '即将开始',
  finished: '已结束',
  unknown: '时间待定',
};

export const formatCheckpointTime = (checkpoint?: TrackingCheckpoint | null) => {
  if (!checkpoint) {
    return '暂无';
  }
  if (checkpoint.time) {
    return checkpoint.timeBeijing
      ? `${checkpoint.time}（北京时间 ${checkpoint.timeBeijing}）`
      : checkpoint.time;
  }
  if (checkpoint.prediction) {
    return checkpoint.predictionBeijing
      ? `预计 ${checkpoint.prediction}（北京时间 ${checkpoint.predictionBeijing}）`
      : `预计 ${checkpoint.prediction}`;
  }
  return '未通过';
};

export const formatCumulativeTime = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const parts = value.split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part))) {
    return value;
  }

  const [first = 0, second = 0, third = 0] = parts;
  const hours = parts.length === 3 ? first : 0;
  const minutes = parts.length === 3 ? second : first;
  const seconds = parts.length === 3 ? third : second;
  return `${hours > 0 ? `${hours}小时` : ''}${minutes}分${seconds}秒`;
};

export const formatDateTime = (
  value?: string | null,
  eventTimezone?: string | null,
) => {
  if (!value || !dayjs(value).isValid()) {
    return '时间待定';
  }

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: eventTimezone || undefined,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  } catch {
    return dayjs(value).format('MM-DD HH:mm');
  }
};

export const formatEventDateTime = (
  value?: string | null,
  eventTimezone?: string | null,
  beijingValue?: string | null,
) => {
  const local = formatDateTime(value, eventTimezone);
  if (
    !beijingValue
    || !eventTimezone
    || eventTimezone === 'Asia/Shanghai'
  ) {
    return local;
  }
  return `${local}（北京时间 ${formatDateTime(
    beijingValue,
    'Asia/Shanghai',
  )}）`;
};
