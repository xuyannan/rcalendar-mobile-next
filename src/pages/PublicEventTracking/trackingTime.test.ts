import { describe, expect, it } from 'vitest';
import { clockSeconds, clockTimestamp } from './trackingTime';

describe('clock reports with fractional seconds', () => {
  it.each([
    ['11:04:40.312', 11 * 3600 + 4 * 60 + 40.312],
    ['12:17:38.149', 12 * 3600 + 17 * 60 + 38.149],
    ['06:00:02.039', 6 * 3600 + 2.039],
    ['06:00:02.1', 6 * 3600 + 2.1],
    ['06:00:02.01', 6 * 3600 + 2.01],
    [' 6:00:02.039 ', 6 * 3600 + 2.039],
    ['12:17:38', 12 * 3600 + 17 * 60 + 38],
    ['06:00', 6 * 3600],
  ])('parses %s', (value, expected) => {
    expect(clockSeconds(value)).toBeCloseTo(expected, 6);
  });
  it.each(['24:00:00.001', '12:60:00.001', '12:00:60.001', '12:00:02.', '12:00:.039', '12:00.039'])('rejects invalid clock %s', (value) => {
    expect(clockSeconds(value)).toBeNull();
  });
  it('anchors to the event date with millisecond precision, including leading-zero seconds', () => {
    const start = Date.parse('2026-11-13T06:00:00+08:00');
    expect(clockTimestamp(12 * 3600 + 17 * 60 + 38.149, start, 'Asia/Shanghai'))
      .toBe(Date.parse('2026-11-13T12:17:38.149+08:00'));
    expect(clockTimestamp(6 * 3600 + 2.039, start, 'Asia/Shanghai'))
      .toBe(Date.parse('2026-11-13T06:00:02.039+08:00'));
  });
  it('preserves milliseconds when rolling across midnight', () => {
    expect(clockTimestamp(2.039, Date.parse('2026-11-13T23:00:00+08:00'), 'Asia/Shanghai'))
      .toBe(Date.parse('2026-11-14T00:00:02.039+08:00'));
  });
  it('does not round the last millisecond into the next day', () => {
    expect(clockTimestamp(86399.999, Date.parse('2026-11-13T06:00:00+08:00'), 'Asia/Shanghai'))
      .toBe(Date.parse('2026-11-13T23:59:59.999+08:00'));
  });
});
