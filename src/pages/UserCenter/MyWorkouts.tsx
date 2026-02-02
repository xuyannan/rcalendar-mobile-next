import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, Title, Text, Group, Select, Badge, Loader, Center } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import 'dayjs/locale/zh-cn';
import request from '../../utils/request';

interface Workout {
  id: number;
  day: string;
  distance: number;
  duration: number;
  pace: number;
  source: string;
  note?: string;
  activityType?: string;
  activeKilocalories?: number;
  avgHeartRate?: number;
  activityName?: string;
  deviceName?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  Manuel: '手动',
  Manual: '手动',
  Ocr: 'OCR',
  Strava: 'Strava',
  Garmin: 'Garmin',
  Coros: 'Coros',
  Other: '其他',
};

const SOURCE_COLORS: Record<string, string> = {
  Manuel: 'gray',
  Manual: 'gray',
  Ocr: 'blue',
  Strava: 'orange',
  Garmin: 'cyan',
  Coros: 'teal',
  Other: 'gray',
};

const SOURCE_OPTIONS = [
  { value: '', label: '全部来源' },
  { value: 'Manuel', label: '手动' },
  { value: 'Ocr', label: 'OCR' },
  { value: 'Strava', label: 'Strava' },
  { value: 'Garmin', label: 'Garmin' },
  { value: 'Coros', label: 'Coros' },
];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm) return '-';
  const m = Math.floor(secondsPerKm / 60);
  const s = secondsPerKm % 60;
  return `${m}'${s.toString().padStart(2, '0')}"`;
}

export default function MyWorkouts() {
  const [searchParams] = useSearchParams();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthDate, setMonthDate] = useState<Date>(new Date());
  const [source, setSource] = useState(() => searchParams.get('provider') || '');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    setLoading(true);
    let url = `/api/v2/myWorkouts/?month=${month}&size=9999`;
    if (source) {
      url += `&source=${source}`;
    }
    request({ url, method: 'GET' })
      .then((res) => {
        const response = res as unknown as { results?: Workout[]; count?: number } | Workout[];
        const data = Array.isArray(response) ? response : response.results;
        const count = Array.isArray(response) ? response.length : (response.count ?? 0);
        if (Array.isArray(data)) {
          setWorkouts(data);
          setTotalCount(count);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [monthDate, source]);

  const rows = workouts.map((w) => (
    <Table.Tr key={w.id}>
      <Table.Td style={{ position: 'sticky', left: 0, backgroundColor: 'var(--mantine-color-body)', zIndex: 1 }}>
        <div>
          <Text size="sm" fw={500}>{w.activityName || '-'}</Text>
          <Text size="xs" c="dimmed">{w.activityType || '-'}</Text>
        </div>
      </Table.Td>
      <Table.Td>{w.day}</Table.Td>
      <Table.Td>{w.distance.toFixed(2)} km</Table.Td>
      <Table.Td>{formatDuration(w.duration)}</Table.Td>
      <Table.Td>{formatPace(w.pace)}</Table.Td>
      <Table.Td>{w.activeKilocalories ?? '-'}</Table.Td>
      <Table.Td>{w.avgHeartRate ?? '-'}</Table.Td>
      <Table.Td>
        <div>
          <Badge color={SOURCE_COLORS[w.source] || 'gray'} variant="light">
            {SOURCE_LABELS[w.source] || w.source}
          </Badge>
          {w.deviceName && <Text size="xs" c="dimmed" mt={4}>{w.deviceName}</Text>}
        </div>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>运动记录</Title>
        <Group>
          <Select
            value={source}
            onChange={(v) => setSource(v || '')}
            data={SOURCE_OPTIONS}
            style={{ width: 120 }}
            placeholder="数据来源"
          />
          <MonthPickerInput
            value={monthDate}
            onChange={(v) => {
              if (v) {
                const d = typeof v === 'string' ? new Date(v) : v;
                setMonthDate(d);
              }
            }}
            locale="zh-cn"
            valueFormat="YYYY年M月"
            style={{ width: 150 }}
          />
        </Group>
      </Group>

      {loading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : workouts.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          暂无运动记录
        </Text>
      ) : (
        <>
          <Text size="sm" c="dimmed" mb="sm">
            共 {totalCount} 条记录
          </Text>
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ position: 'sticky', left: 0, backgroundColor: 'var(--mantine-color-body)', zIndex: 1 }}>名称/类型</Table.Th>
                  <Table.Th>日期</Table.Th>
                  <Table.Th>距离</Table.Th>
                  <Table.Th>时间</Table.Th>
                  <Table.Th>配速</Table.Th>
                  <Table.Th>卡路里</Table.Th>
                  <Table.Th>平均心率</Table.Th>
                  <Table.Th>数据来源</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </>
      )}
    </div>
  );
}
