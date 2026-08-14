import {
  Accordion,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { IconList, IconMapPin, IconTrash } from '@tabler/icons-react';
import type {
  OfficialRunnerProfile,
  PublicTrackingRunner,
  TrackingCheckpoint,
  TrackingStatus,
} from '../types';
import {
  formatCheckpointTime,
  formatCumulativeTime,
  formatEventDateTime,
} from '../utils';

interface RunnerCardProps {
  runner: PublicTrackingRunner;
  groupName: string;
  canRemove: boolean;
  eventTimezone?: string;
  isRemoving?: boolean;
  onRemove: (runnerId: number) => void;
}

const STATUS_MAP: Record<TrackingStatus, { label: string; color: string }> = {
  not_started: { label: '未开始', color: 'gray' },
  racing: { label: '比赛中', color: 'blue' },
  finished: { label: '已完赛', color: 'green' },
  dns: { label: 'DNS', color: 'orange' },
  dnf: { label: 'DNF', color: 'red' },
};

export const RunnerProfileMeta = ({
  profile,
  compact = false,
}: {
  profile: OfficialRunnerProfile;
  compact?: boolean;
}) => {
  const hasProfile = (
    profile.utmbIndex !== null
    && profile.utmbIndex !== undefined
  ) || Boolean(profile.ageGroup || profile.brand || profile.nationality);

  if (!hasProfile) {
    return null;
  }

  return (
    <Group gap={compact ? 4 : 6} wrap="wrap">
      {profile.utmbIndex !== null && profile.utmbIndex !== undefined && (
        <Badge color="cyan" size={compact ? 'xs' : 'sm'} variant="light">
          UTMB INDEX {profile.utmbIndex}
        </Badge>
      )}
      {profile.ageGroup && (
        <Badge color="gray" size={compact ? 'xs' : 'sm'} variant="light">
          {profile.ageGroup}
        </Badge>
      )}
      {profile.brand && (
        <Text size={compact ? 'xs' : 'sm'} c="dimmed" truncate>
          {profile.brand}
        </Text>
      )}
      {profile.nationality && (
        <Badge color="teal" size={compact ? 'xs' : 'sm'} variant="light">
          国籍 {profile.nationality}
        </Badge>
      )}
    </Group>
  );
};

const CheckpointSummary = ({
  label,
  checkpoint,
}: {
  label: string;
  checkpoint: TrackingCheckpoint | null;
}) => (
  <Box style={{ flex: 1, minWidth: 0 }}>
    <Text size="xs" c="dimmed">{label}</Text>
    <Text size="sm" fw={600} truncate>
      {checkpoint?.name || '暂无'}
    </Text>
    <Text size="xs" c={checkpoint?.isPredicted ? 'orange' : 'dimmed'}>
      {formatCheckpointTime(checkpoint)}
    </Text>
    {checkpoint?.cumulativeTime && (
      <Text size="xs" c="dimmed">
        累计 {formatCumulativeTime(checkpoint.cumulativeTime)}
      </Text>
    )}
  </Box>
);

const formatNumber = (value: number) => (
  Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.?0+$/, '')
);

const formatSegmentStats = (checkpoint: TrackingCheckpoint) => {
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

const RunnerCard: React.FC<RunnerCardProps> = ({
  runner,
  groupName,
  canRemove,
  eventTimezone,
  isRemoving = false,
  onRemove,
}) => {
  const status = STATUS_MAP[runner.status] || STATUS_MAP.not_started;
  const displayName = runner.nickname || runner.name || '未知选手';
  const location = runner.location;

  return (
    <Card withBorder radius="md" shadow="sm" padding="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group align="flex-start" gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <Avatar
              src={runner.avatarUrl || undefined}
              alt={runner.name || displayName}
              radius="xl"
              size="lg"
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Box style={{ minWidth: 0 }}>
              <Group gap="xs" wrap="nowrap">
                <Text fw={700} size="lg" truncate>{displayName}</Text>
                <Badge color={status.color} variant="light">
                  {status.label}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {runner.nickname && runner.name
                  ? `${runner.name} · `
                  : ''}
                #{runner.bibNumber} · {groupName}
              </Text>
              <RunnerProfileMeta profile={runner} />
            </Box>
          </Group>
          {canRemove && (
            <Button
              variant="subtle"
              color="red"
              size="compact-xs"
              leftSection={<IconTrash size={14} />}
              loading={isRemoving}
              onClick={() => onRemove(runner.id)}
            >
              移除
            </Button>
          )}
        </Group>

        <Group align="stretch" gap="md" wrap="nowrap">
          <CheckpointSummary
            label="当前检查点"
            checkpoint={runner.currentCheckpoint}
          />
          <Divider orientation="vertical" />
          <CheckpointSummary
            label="下一检查点"
            checkpoint={runner.nextCheckpoint}
          />
        </Group>

        {runner.ranking && (
          <Text size="xs" c="dimmed">
            排名 {String(runner.ranking.overall || runner.ranking.category || '暂无')}
          </Text>
        )}
        {location && (
          <Group gap={4}>
            <IconMapPin size={14} color="var(--mantine-color-blue-6)" />
            <Text size="xs" c="dimmed">位置已更新</Text>
          </Group>
        )}

        <Accordion variant="transparent" chevronPosition="right">
          <Accordion.Item value="history">
            <Accordion.Control
              styles={{
                control: { minHeight: 28, padding: '2px 0' },
                label: { padding: 0 },
                chevron: { marginLeft: 4 },
              }}
            >
              <Group gap={4} wrap="nowrap">
                <IconList size={14} />
                <Text size="xs" c="blue">
                  查看历史检查点
                </Text>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                {runner.history.map((checkpoint) => (
                  <Group
                    key={`${checkpoint.id}-${checkpoint.providerPointId || checkpoint.name}`}
                    justify="space-between"
                    wrap="nowrap"
                  >
                    <Text size="sm" truncate>{checkpoint.name}</Text>
                    <Box ta="right">
                      <Text
                        size="sm"
                        c={checkpoint.isPredicted ? 'orange' : undefined}
                      >
                        {checkpoint.time || checkpoint.prediction
                          ? formatCheckpointTime(checkpoint)
                          : '—'}
                      </Text>
                      {formatSegmentStats(checkpoint) && (
                        <Text size="xs" c="dimmed">
                          {formatSegmentStats(checkpoint)}
                        </Text>
                      )}
                    </Box>
                  </Group>
                ))}
                {runner.history.length === 0 && (
                  <Text size="sm" c="dimmed">暂无检查点数据</Text>
                )}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Text size="xs" c="dimmed">
          最后更新：
          {(runner.lastRefreshAtLocal || runner.lastRefreshAt)
            ? formatEventDateTime(
              runner.lastRefreshAtLocal || runner.lastRefreshAt,
              eventTimezone,
              runner.lastRefreshAtBeijing,
            )
            : '暂无'}
        </Text>
      </Stack>
    </Card>
  );
};

export default RunnerCard;
