import React, { useMemo, useState, useEffect } from 'react';
import { Table, Paper, Title, Group, Button, Text, Badge, ActionIcon, Modal, TextInput, Switch, SegmentedControl, Stack, ScrollArea, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import request from '../../../utils/request';
import type { EventGroup, TrackedRunner } from '../types';

interface TrackedRunnersTableProps {
  group: EventGroup;
}

const STATUS_OPTIONS = [
  { value: 'not_started', label: '未开始' },
  { value: 'racing', label: '比赛中' },
  { value: 'finished', label: '已完赛' },
  { value: 'dns', label: 'DNS' },
  { value: 'dnf', label: 'DNF' },
];

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  not_started: { text: '未开始', color: 'gray' },
  racing: { text: '比赛中', color: 'blue' },
  finished: { text: '已完赛', color: 'green' },
  dns: { text: 'DNS', color: 'orange' },
  dnf: { text: 'DNF', color: 'red' },
};

const TrackedRunnersTable: React.FC<TrackedRunnersTableProps> = ({ group }) => {
  const queryClient = useQueryClient();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingRunner, setEditingRunner] = useState<TrackedRunner | null>(null);
  const [refreshingRunners, setRefreshingRunners] = useState<Set<number>>(new Set());
  const [countdown, setCountdown] = useState<Record<number, number>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    bibNumber: '',
    trackingUrl: '',
    status: 'not_started',
    isAutoRefresh: true,
  });

  // Initialize countdown
  useEffect(() => {
    if (group.trackedRunners) {
      setCountdown(prev => {
        const next = { ...prev };
        group.trackedRunners!.forEach(runner => {
          if (runner.id) {
            const serverValue = runner.nextRefreshIn;
            const localValue = prev[runner.id];
            if (serverValue > 0 && (localValue === undefined || serverValue > localValue)) {
              next[runner.id] = serverValue;
            } else if (serverValue <= 0) {
              delete next[runner.id];
            }
          }
        });
        return next;
      });
    }
  }, [group.trackedRunners]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        const next: Record<number, number> = {};
        Object.entries(prev).forEach(([id, value]) => {
          if (value > 1) {
            next[Number(id)] = value - 1;
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mutations
  const createRunnerMutation = useMutation({
    mutationFn: async (values: any) => {
      return request.post('/tracked-runners/', values);
    },
    onSuccess: () => {
      notifications.show({ message: '添加成功', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['eventDashboard'] });
      closeModal();
    },
    onError: () => {
      notifications.show({ message: '添加失败', color: 'red' });
    },
  });

  const updateRunnerMutation = useMutation({
    mutationFn: async ({ id, ...values }: any) => {
      return request.patch(`/tracked-runners/${id}/`, values);
    },
    onSuccess: () => {
      notifications.show({ message: '更新成功', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['eventDashboard'] });
      closeModal();
    },
    onError: () => {
      notifications.show({ message: '更新失败', color: 'red' });
    },
  });

  const deleteRunnerMutation = useMutation({
    mutationFn: async (id: number) => {
      return request.delete(`/tracked-runners/${id}/`);
    },
    onSuccess: () => {
      notifications.show({ message: '删除成功', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['eventDashboard'] });
    },
    onError: () => {
      notifications.show({ message: '删除失败', color: 'red' });
    },
  });

  const refreshRunnerMutation = useMutation({
    mutationFn: async (runnerId: number) => {
      setRefreshingRunners(prev => new Set(prev).add(runnerId));
      return request.post(`/tracked-runners/${runnerId}/refresh/`, {});
    },
    onSuccess: (response: any, runnerId) => {
      setRefreshingRunners(prev => {
        const next = new Set(prev);
        next.delete(runnerId);
        return next;
      });
      if (response.code === 0) {
        notifications.show({ message: response.msg || '刷新成功', color: 'green' });
      } else if (response.code === -2) {
        notifications.show({ message: response.msg || '刷新太频繁', color: 'yellow' });
      } else {
        notifications.show({ message: response.msg || '刷新失败', color: 'red' });
      }
      queryClient.invalidateQueries({ queryKey: ['eventDashboard'] });
    },
    onError: (_error, runnerId) => {
      setRefreshingRunners(prev => {
        const next = new Set(prev);
        next.delete(runnerId);
        return next;
      });
      notifications.show({ message: '刷新失败', color: 'red' });
    },
  });

  const toggleAutoRefreshMutation = useMutation({
    mutationFn: async ({ id, isAutoRefresh }: { id: number; isAutoRefresh: boolean }) => {
      return request.patch(`/tracked-runners/${id}/`, { isAutoRefresh });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventDashboard'] });
    },
  });

  // Parse checkpoint data
  const parseCheckpointData = (result: string | undefined, checkpointName: string) => {
    if (!result) return { display: '-', isPredicted: false, cumulativeTime: undefined };
    try {
      const data = JSON.parse(result);
      const cpData = data[checkpointName];
      if (!cpData) return { display: '-', isPredicted: false, cumulativeTime: undefined };
      
      if (typeof cpData === 'string') {
        return { display: cpData, isPredicted: false, cumulativeTime: undefined };
      }
      
      if (cpData.time) {
        return { 
          display: cpData.time, 
          isPredicted: false, 
          cumulativeTime: cpData.cumulative_time || undefined 
        };
      }
      
      return { display: '-', isPredicted: false, cumulativeTime: undefined };
    } catch {
      return { display: '-', isPredicted: false, cumulativeTime: undefined };
    }
  };

  // Format cumulative time
  const formatCumulativeTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const parts = timeStr.split(':').map(Number);
    if (parts.length < 2) return '';
    
    let hours = 0, minutes = 0, seconds = 0;
    if (parts.length === 3) {
      [hours, minutes, seconds] = parts;
    } else if (parts.length === 2) {
      [hours, minutes] = parts;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    const result: string[] = [];
    if (days > 0) result.push(`${days}天`);
    if (remainingHours > 0 || days > 0) result.push(`${remainingHours}小时`);
    if (minutes > 0 || result.length > 0) result.push(`${minutes}分`);
    result.push(`${seconds}秒`);
    
    return result.join('');
  };

  // const handleAddRunner = () => {
  //   setEditingRunner(null);
  //   setFormData({
  //     name: '',
  //     nickname: '',
  //     bibNumber: '',
  //     trackingUrl: '',
  //     status: 'not_started',
  //     isAutoRefresh: true,
  //   });
  //   openModal();
  // };

  const handleEditRunner = (runner: TrackedRunner) => {
    setEditingRunner(runner);
    setFormData({
      name: runner.name || '',
      nickname: runner.nickname || '',
      bibNumber: runner.bibNumber || '',
      trackingUrl: runner.trackingUrl || '',
      status: runner.status,
      isAutoRefresh: runner.isAutoRefresh,
    });
    openModal();
  };

  const handleSubmit = () => {
    const payload = { ...formData, eventGroup: group.id };
    if (editingRunner?.id) {
      updateRunnerMutation.mutate({ id: editingRunner.id, ...payload });
    } else {
      createRunnerMutation.mutate(payload);
    }
  };

  const allCheckpoints = group.checkpoints || [];
  const sortedCheckpoints = [...allCheckpoints].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Build table columns
  const columns = useMemo(() => {
    const baseColumns = [
      { key: 'nicknameAndBib', label: '昵称', sticky: true },
    ];

    const cpColumns = sortedCheckpoints.map(cp => ({
      key: `cp_${cp.id}`,
      label: cp.name,
      checkpointName: cp.name,
    }));

    const endColumns = [
      { key: 'status', label: '状态' },
      // { key: 'isAutoRefresh', label: '自动刷新' },
      { key: 'updatedAt', label: '更新时间'},
      // { key: 'actions', label: '操作' },
    ];

    return [...baseColumns, ...cpColumns, ...endColumns];
  }, [sortedCheckpoints]);

  // If no tracked runners, don't render the table at all
  if (!group.trackedRunners || group.trackedRunners.length === 0) {
    return null;
  }

  const renderCell = (runner: TrackedRunner, column: any) => {
    const isRefreshing = refreshingRunners.has(runner.id!);
    const nextRefreshIn = runner.nextRefreshIn;
    const currentCountdown = countdown[runner.id!] ?? nextRefreshIn;
    const canRefresh = nextRefreshIn === -1 ? false : currentCountdown <= 0;

    switch (column.key) {
      case 'nicknameAndBib':
        return (
          <Box style={{ whiteSpace: 'nowrap' }}>
            <Text size="sm">{runner.nickname || runner.name || '-'}</Text>
            <Text size="xs" c="dimmed">{runner.bibNumber || '-'}</Text>
          </Box>
        );
      case 'name':
        return runner.name || '-';
      case 'nickname':
        return runner.nickname || '-';
      case 'bibNumber':
        return runner.bibNumber || '-';
      case 'status':
        const status = runner.status || 'not_started';
        const { text, color } = STATUS_MAP[status] || STATUS_MAP.not_started;
        return <Badge color={color} size="sm">{text}</Badge>;
      case 'isAutoRefresh':
        return (
          <Switch
            size="xs"
            checked={runner.isAutoRefresh}
            onChange={(e) => toggleAutoRefreshMutation.mutate({ 
              id: runner.id!, 
              isAutoRefresh: e.currentTarget.checked 
            })}
          />
        );
      case 'updatedAt':
        return runner.lastRefreshAt 
          ? dayjs(runner.lastRefreshAt).format('MM-DD HH:mm:ss')
          : '-';
      case 'actions':
        let refreshBtnText = '刷新';
        if (isRefreshing) refreshBtnText = '...';
        else if (nextRefreshIn === -1) refreshBtnText = '-';
        else if (currentCountdown > 0) refreshBtnText = `${currentCountdown}s`;
        
        return (
          <Group gap={4} wrap="nowrap">
            <Button 
              size="compact-xs" 
              variant="light"
              onClick={() => refreshRunnerMutation.mutate(runner.id!)}
              disabled={isRefreshing || !canRefresh}
              loading={isRefreshing}
            >
              {refreshBtnText}
            </Button>
            <ActionIcon size="sm" variant="subtle" onClick={() => handleEditRunner(runner)}>
              <IconEdit size={14} />
            </ActionIcon>
            <ActionIcon size="sm" variant="subtle" color="red" onClick={() => {
              if (confirm('确定删除?')) {
                deleteRunnerMutation.mutate(runner.id!);
              }
            }}>
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        );
      default:
        if (column.checkpointName) {
          const { display, cumulativeTime } = parseCheckpointData(
            runner.latestResult?.result,
            column.checkpointName
          );
          return (
            <Box style={{ whiteSpace: 'nowrap' }}>
              <Text size="sm">{display}</Text>
              {cumulativeTime && (
                <Text size="xs" c="dimmed">{formatCumulativeTime(cumulativeTime)}</Text>
              )}
            </Box>
          );
        }
        return '-';
    }
  };

  return (
    <Paper p="md" mb="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={5}>{group.name}</Title>
        {/* <Button size="xs" leftSection={<IconPlus size={14} />} onClick={handleAddRunner}>
          添加选手
        </Button> */}
      </Group>

      <ScrollArea>
        <Table striped highlightOnHover withTableBorder withColumnBorders style={{ minWidth: 800 }}>
          <Table.Thead>
            <Table.Tr>
              {columns.map((col, idx) => (
                <Table.Th 
                  key={col.key}
                  style={idx === 0 ? { 
                    position: 'sticky', 
                    left: 0, 
                    background: 'var(--mantine-color-body)',
                    zIndex: 1 
                  } : undefined}
                >
                  {col.label}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {group.trackedRunners.map(runner => (
              <Table.Tr key={runner.id}>
                {columns.map((col, idx) => (
                  <Table.Td 
                    key={col.key}
                    style={idx === 0 ? { 
                      position: 'sticky', 
                      left: 0, 
                      background: 'var(--mantine-color-body)',
                      zIndex: 1 
                    } : undefined}
                  >
                    {renderCell(runner, col)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Modal opened={modalOpened} onClose={closeModal} title={editingRunner ? '编辑选手' : '添加选手'}>
        <Stack>
          <TextInput
            label="姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
          />
          <TextInput
            label="昵称"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.currentTarget.value })}
          />
          <TextInput
            label="参赛号码"
            value={formData.bibNumber}
            onChange={(e) => setFormData({ ...formData, bibNumber: e.currentTarget.value })}
          />
          <TextInput
            label="追踪页面URL"
            value={formData.trackingUrl}
            onChange={(e) => setFormData({ ...formData, trackingUrl: e.currentTarget.value })}
          />
          <Box>
            <Text size="sm" mb={4}>选手状态</Text>
            <SegmentedControl
              fullWidth
              size="xs"
              data={STATUS_OPTIONS}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
            />
          </Box>
          <Switch
            label="自动刷新"
            checked={formData.isAutoRefresh}
            onChange={(e) => setFormData({ ...formData, isAutoRefresh: e.currentTarget.checked })}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeModal}>取消</Button>
            <Button 
              onClick={handleSubmit}
              loading={createRunnerMutation.isPending || updateRunnerMutation.isPending}
            >
              确定
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
};

export default TrackedRunnersTable;
