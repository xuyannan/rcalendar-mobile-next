import {
  ActionIcon,
  Box,
  Badge,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconChevronDown, IconChevronRight, IconSearch, IconX } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import type { PublicTrackingGroup } from '../types';
import {
  formatEventDateTime,
  getGroupState,
  groupStateLabel,
} from '../utils';
import { filterTrackingRunners, sortTrackingRunners } from '../runnerOrdering';
import RunnerCard from './RunnerCard';
import RunnerList from './RunnerListRow';
import type { TrackingViewMode } from './TrackingViewControls';

const COLLAPSE_STORAGE_PREFIX = 'event-tracking-group-collapse:';

const collapseStorageKey = (storageKey: string) => (
  `${COLLAPSE_STORAGE_PREFIX}${storageKey}`
);

const readCollapsedState = (storageKey: string) => {
  try {
    const raw = localStorage.getItem(collapseStorageKey(storageKey));
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === 'boolean'),
    ) as Record<string, boolean>;
  } catch {
    return {};
  }
};

interface TrackingGroupsProps {
  groups: PublicTrackingGroup[];
  now: number;
  eventTimezone: string;
  viewMode: TrackingViewMode;
  storageKey: string;
  canRemove: boolean;
  removingRunnerId: number | null;
  emptyMessage: string;
  onRemove: (runnerId: number) => void;
}

const TrackingGroups = ({
  groups,
  now,
  eventTimezone,
  viewMode,
  storageKey,
  canRemove,
  removingRunnerId,
  emptyMessage,
  onRemove,
}: TrackingGroupsProps) => {
  const [expandedByGroup, setExpandedByGroup] = useState<Record<string, boolean>>(
    () => readCollapsedState(storageKey),
  );

  const [queries, setQueries] = useState<Record<string, string>>({});
  const sortedGroups = useMemo(() => groups.map((group) => ({
    ...group,
    runners: sortTrackingRunners(group, eventTimezone),
  })), [groups, eventTimezone]);

  useEffect(() => {
    try {
      localStorage.setItem(
        collapseStorageKey(storageKey),
        JSON.stringify(expandedByGroup),
      );
    } catch {
      // Keep the setting in memory when browser storage is unavailable.
    }
  }, [expandedByGroup, storageKey]);

  return (
    <Stack gap="xs">
      {sortedGroups.map((group) => {
        const state = getGroupState(group, now, eventTimezone);
        const groupKey = String(group.id);
        const expanded = expandedByGroup[groupKey] ?? group.runners.length > 0;
        const query = queries[groupKey] || '';
        const visibleRunners = filterTrackingRunners(group.runners, query);
        return (
          <Stack key={group.id} gap="xs" component="section" aria-label={group.name}>
            <Group gap="xs" align="center" wrap="wrap">
              <UnstyledButton
                onClick={() => setExpandedByGroup((current) => ({
                  ...current,
                  [groupKey]: !expanded,
                }))}
                aria-expanded={expanded}
                aria-controls={`tracking-group-${group.id}`}
                style={{
                  display: 'block',
                  flex: '1 1 200px',
                  minWidth: 0,
                  textAlign: 'left',
                  borderRadius: 'var(--mantine-radius-md)',
                }}
              >
                <Group justify="space-between" align="center" wrap="nowrap" px="xs" py={4}>
                  <Group gap="xs" align="flex-start" wrap="nowrap" style={{ minWidth: 0 }}>
                    {expanded
                      ? <IconChevronDown size={18} aria-hidden />
                      : <IconChevronRight size={18} aria-hidden />}
                    <Box style={{ minWidth: 0 }}>
                      <Group gap="xs" wrap="wrap">
                        <Title order={4}>{group.name}</Title>
                        <Text size="sm" c="dimmed">{group.runners.length} 位选手</Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {formatEventDateTime(
                          group.startAt,
                          eventTimezone,
                          group.startAtBeijing,
                        )}
                        {group.distance
                          ? ` · ${group.distance}${group.distanceUnit || 'km'}`
                          : ''}
                      </Text>
                    </Box>
                  </Group>
                  <Badge
                    color={
                      state === 'ongoing'
                        ? 'blue'
                        : state === 'finished'
                          ? 'gray'
                          : 'orange'
                    }
                    variant="light"
                    style={{ flexShrink: 0 }}
                  >
                    {groupStateLabel[state]}
                  </Badge>
                </Group>
              </UnstyledButton>
              <TextInput
                size="xs"
                w={155}
                maw="100%"
                aria-label={`筛选${group.name}选手`}
                placeholder="姓名 / 昵称 / 号码"
                leftSection={<IconSearch size={14} />}
                value={query}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setQueries((current) => ({ ...current, [groupKey]: value }));
                }}
                rightSection={query ? (
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    aria-label={`清空${group.name}筛选`}
                    onClick={() => setQueries((current) => ({ ...current, [groupKey]: '' }))}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                ) : undefined}
              />
            </Group>
            {expanded && (
              <Box id={`tracking-group-${group.id}`}>
                {visibleRunners.length > 0 ? (
                  viewMode === 'cards' ? (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                      {visibleRunners.map((runner) => (
                        <RunnerCard
                          key={runner.id}
                          runner={runner}
                          groupName={group.name}
                          eventTimezone={eventTimezone}
                          canRemove={canRemove}
                          isRemoving={removingRunnerId === runner.id}
                          onRemove={onRemove}
                        />
                      ))}
                    </SimpleGrid>
                  ) : (
                    <RunnerList
                      runners={visibleRunners}
                      canRemove={canRemove}
                      removingRunnerId={removingRunnerId}
                      onRemove={onRemove}
                    />
                  )
                ) : (
                  <Paper withBorder p="md" radius="md">
                    <Text size="sm" c="dimmed" role="status">
                      {group.runners.length > 0 ? '未找到匹配选手' : emptyMessage}
                    </Text>
                  </Paper>
                )}
              </Box>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
};

export default TrackingGroups;
