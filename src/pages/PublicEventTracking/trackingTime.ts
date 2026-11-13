import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { PublicTrackingGroup } from './types';

dayjs.extend(utc);
dayjs.extend(timezone);

// Offset-bearing dates are absolute. Bare dates belong to the event timezone,
// never the viewer's timezone. Reject rollover dates rather than guessing.
export const parseTrackingDate = (
  value?: string | null,
  eventTimezone = 'UTC',
): number | null => {
  const text = value?.trim();
  const match = text?.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/i);
  if (!text || !match) return null;
  const [, year, month, date, hour = '0', minute = '0', second = '0', offset] = match;
  const check = new Date(Date.UTC(+year, +month - 1, +date));
  if (check.getUTCFullYear() !== +year || check.getUTCMonth() !== +month - 1
    || check.getUTCDate() !== +date || +hour > 23 || +minute > 59 || +second > 59) {
    return null;
  }
  try {
    const parsed = offset
      ? dayjs(text.replace(' ', 'T'))
      : dayjs.tz(text, eventTimezone);
    return parsed.isValid() ? parsed.valueOf() : null;
  } catch {
    return null;
  }
};

export const groupTimestamp = (
  group: PublicTrackingGroup,
  field: 'startAt' | 'closeAt',
  eventTimezone = 'UTC',
) => parseTrackingDate(group[field], eventTimezone)
  ?? parseTrackingDate(group[`${field}Local`], eventTimezone)
  ?? parseTrackingDate(group[`${field}Beijing`], 'Asia/Shanghai');

export const clockSeconds = (value: string): number | null => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/);
  if (!match) return null;
  const [, hour, minute, second = '0', fraction = '0'] = match;
  return +hour < 24 && +minute < 60 && +second < 60
    ? +hour * 3600 + +minute * 60 + +second + Number(`0.${fraction.slice(0, 3)}`)
    : null;
};

export const trackingDayStart = (time: number, eventTimezone: string) => {
  try {
    return dayjs(time).tz(eventTimezone).startOf('day').valueOf();
  } catch {
    return null;
  }
};

// Time-only reports have no day. Anchor to the race start (or a dated report)
// and roll forward at midnight. Segment durations cannot resolve multi-day ambiguity.
export const clockTimestamp = (seconds: number, anchor: number | null, eventTimezone: string) => {
  const milliseconds = Math.round(seconds * 1000);
  if (anchor === null) return milliseconds;
  try {
    const local = dayjs(anchor).tz(eventTimezone);
    const wholeSeconds = Math.floor(milliseconds / 1000);
    const hhmmss = [Math.floor(wholeSeconds / 3600), Math.floor(wholeSeconds / 60) % 60, wholeSeconds % 60]
      .map((part) => String(part).padStart(2, '0')).join(':')
      + `.${String(milliseconds % 1000).padStart(3, '0')}`;
    let result = dayjs.tz(`${local.format('YYYY-MM-DD')} ${hhmmss}`, eventTimezone).valueOf();
    if (result < anchor) {
      result = dayjs.tz(`${local.add(1, 'day').format('YYYY-MM-DD')} ${hhmmss}`, eventTimezone).valueOf();
    }
    return result;
  } catch {
    return milliseconds;
  }
};
