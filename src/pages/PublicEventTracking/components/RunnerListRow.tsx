import {
  Accordion,
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { IconList, IconTrash } from '@tabler/icons-react';
import type { PublicTrackingRunner, TrackingCheckpoint } from '../types';
import { formatCheckpointTime, formatCumulativeTime } from '../utils';
import { RunnerProfileMeta } from './RunnerCard';
import { formatSegmentStats, STATUS_MAP } from './trackingDisplay';

interface RunnerListRowProps {
  runner: PublicTrackingRunner;
  canRemove: boolean;
  isRemoving?: boolean;
  onRemove: (runnerId: number) => void;
}

const CheckpointCell = ({
  label,
  checkpoint,
}: {
  label: string;
  checkpoint: TrackingCheckpoint | null;
}) => (
  <Box style={{ minWidth: 0 }}>
    <Text size="xs" c="dimmed">{label}</Text>
    <Text size="sm" fw={600} truncate>
      {checkpoint?.name || '—'}
    </Text>
    <Text size="xs" c={checkpoint?.isPredicted ? 'orange' : 'dimmed'}>
      {checkpoint ? formatCheckpointTime(checkpoint) : '—'}
    </Text>
    {checkpoint?.cumulativeTime && (
      <Text size="xs" c="dimmed">
        累计 {formatCumulativeTime(checkpoint.cumulativeTime)}
      </Text>
    )}
  </Box>
);

const RunnerIdentity = ({
  runner,
  compact = false,
}: {
  runner: PublicTrackingRunner;
  compact?: boolean;
}) => {
  const status = STATUS_MAP[runner.status] || STATUS_MAP.not_started;
  const displayName = runner.nickname || runner.name || '未知选手';

  return (
    <Group align="flex-start" gap={compact ? 'xs' : 'sm'} wrap="nowrap">
      <Avatar
        src={runner.avatarUrl || undefined}
        alt={runner.name || displayName}
        radius="xl"
        size={compact ? 'sm' : 'md'}
      >
        {displayName.charAt(0).toUpperCase()}
      </Avatar>
      <Box style={{ minWidth: 0, flex: 1 }}>
        <Group gap="xs" wrap="wrap">
          <Text fw={700} size={compact ? 'sm' : 'md'}>{displayName}</Text>
          <Badge color={status.color} variant="light" size="sm">
            {status.label}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed" truncate>
          #{runner.bibNumber}
          {runner.nickname && runner.name ? ` · ${runner.name}` : ''}
        </Text>
        {!compact && <RunnerProfileMeta profile={runner} compact />}
      </Box>
    </Group>
  );
};

const RunnerListRow = ({
  runner,
  canRemove,
  isRemoving = false,
  onRemove,
}: RunnerListRowProps) => {
  const removeAction = canRemove ? (
    <ActionIcon
      variant="subtle"
      color="red"
      size="sm"
      loading={isRemoving}
      aria-label={`移除${runner.nickname || runner.name || '选手'}`}
      onClick={(event) => {
        event.stopPropagation();
        onRemove(runner.id);
      }}
    >
      <IconTrash size={15} />
    </ActionIcon>
  ) : null;

  return (
    <Accordion.Item value={String(runner.id)}>
      <Group gap={0} wrap="nowrap" align="flex-start">
        <Accordion.Control
          style={{ flex: 1, minWidth: 0 }}
          px="sm"
          py="xs"
          styles={{
            control: { background: 'transparent' },
            chevron: { marginLeft: 4 },
          }}
        >
          <Box visibleFrom="sm">
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)',
                gap: 16,
                alignItems: 'center',
              }}
            >
              <RunnerIdentity runner={runner} />
              <CheckpointCell label="当前检查点" checkpoint={runner.currentCheckpoint} />
              <CheckpointCell label="下一检查点" checkpoint={runner.nextCheckpoint} />
            </Box>
          </Box>
          <Box hiddenFrom="sm">
            <Stack gap="xs" pr="xs">
              <RunnerIdentity runner={runner} compact />
              <SimpleGrid cols={2} spacing="xs">
                <CheckpointCell label="当前检查点" checkpoint={runner.currentCheckpoint} />
                <CheckpointCell label="下一检查点" checkpoint={runner.nextCheckpoint} />
              </SimpleGrid>
            </Stack>
          </Box>
        </Accordion.Control>
        {canRemove && <Box pt="md" pr="xs">{removeAction}</Box>}
      </Group>
      <Accordion.Panel px="sm" pb="sm">
        <Stack gap="xs">
          <Group gap="xs">
            <IconList size={15} />
            <Text size="sm" fw={600}>所有检查点</Text>
          </Group>
          {runner.history.map((checkpoint) => (
            <Group
              key={`${checkpoint.id}-${checkpoint.providerPointId || checkpoint.name}`}
              justify="space-between"
              align="flex-start"
              wrap="nowrap"
              gap="sm"
            >
              <Text size="sm" truncate>{checkpoint.name}</Text>
              <Box ta="right" style={{ flexShrink: 0 }}>
                <Text
                  size="sm"
                  c={checkpoint.isPredicted ? 'orange' : undefined}
                >
                  {checkpoint.time || checkpoint.prediction
                    ? formatCheckpointTime(checkpoint)
                    : '—'}
                </Text>
                {checkpoint.cumulativeTime && (
                  <Text size="xs" c="dimmed">
                    累计 {formatCumulativeTime(checkpoint.cumulativeTime)}
                  </Text>
                )}
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
  );
};

export const RunnerList = ({
  runners,
  canRemove,
  removingRunnerId,
  onRemove,
}: {
  runners: PublicTrackingRunner[];
  canRemove: boolean;
  removingRunnerId: number | null;
  onRemove: (runnerId: number) => void;
}) => (
  <Accordion variant="contained" radius="md">
    {runners.map((runner) => (
      <RunnerListRow
        key={runner.id}
        runner={runner}
        canRemove={canRemove}
        isRemoving={removingRunnerId === runner.id}
        onRemove={onRemove}
      />
    ))}
  </Accordion>
);

export default RunnerList;
