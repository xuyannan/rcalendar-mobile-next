import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table, Title, Text, Group, Select, Badge, Loader, Center } from '@mantine/core';
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

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    options.push({ value, label });
  }
  return options;
}

export default function MyWorkouts() {
  const [searchParams] = useSearchParams();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [source, setSource] = useState(() => searchParams.get('provider') || '');

  useEffect(() => {
    setLoading(true);
    let url = `/api/v2/myWorkouts/?month=${month}`;
    if (source) {
      url += `&source=${source}`;
    }
    request({ url, method: 'GET' })
      .then((res) => {
        const response = res as unknown as { results?: Workout[] } | Workout[];
        const data = Array.isArray(response) ? response : response.results;
        if (Array.isArray(data)) {
          setWorkouts(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month, source]);

  const rows = workouts.map((w) => (
    <Table.Tr key={w.id}>
      <Table.Td>
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
          <Select
            value={month}
            onChange={(v) => v && setMonth(v)}
            data={getMonthOptions()}
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
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>名称/类型</Table.Th>
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
      )}
    </div>
  );
}
