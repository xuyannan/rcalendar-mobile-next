import {
  Avatar,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import request from '../../../utils/request';
import { RunnerProfileMeta } from './RunnerCard';
import type {
  ResolutionCandidate,
  ResolveResponse,
} from '../types';

interface RunnerSearchModalProps {
  opened: boolean;
  eventId: string;
  groupOptions: Array<{ value: string; label: string }>;
  onClose: () => void;
  onConfirm: (
    candidate: ResolutionCandidate,
    nickname: string,
  ) => Promise<void>;
  confirmLabel?: string;
  showNickname?: boolean;
}

const RunnerSearchModal = ({
  opened,
  eventId,
  groupOptions,
  onClose,
  onConfirm,
  confirmLabel = '确认添加',
  showNickname = true,
}: RunnerSearchModalProps) => {
  const [bibNumber, setBibNumber] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ResolutionCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] =
    useState<ResolutionCandidate | null>(null);
  const [nickname, setNickname] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const reset = useCallback(() => {
    setBibNumber('');
    setGroupId(null);
    setResolveError(null);
    setCandidates([]);
    setSelectedCandidate(null);
    setNickname('');
    setIsResolving(false);
    setIsConfirming(false);
  }, []);

  useEffect(() => {
    if (opened) {
      reset();
    }
  }, [opened, reset]);

  const resolveRunner = async () => {
    const normalizedBib = bibNumber.trim();
    if (!normalizedBib) {
      setResolveError('请输入号码布');
      return;
    }

    setIsResolving(true);
    setResolveError(null);
    setCandidates([]);
    setSelectedCandidate(null);
    try {
      const response = await request.post(
        `/api/v2/events/${eventId}/public-tracking/resolve/`,
        {
          bibNumber: normalizedBib,
          ...(groupId ? { eventGroupId: Number(groupId) } : {}),
        },
      ) as ResolveResponse;
      if (!response.candidates?.length) {
        setResolveError('未找到该号码布的选手');
        return;
      }
      setCandidates(response.candidates);
      setSelectedCandidate(
        response.candidates.length === 1 ? response.candidates[0] : null,
      );
    } catch (error: unknown) {
      const response = (
        error as { response?: { data?: { detail?: string; message?: string } } }
      )?.response;
      setResolveError(
        response?.data?.detail
          || response?.data?.message
          || '查询失败，请稍后重试',
      );
    } finally {
      setIsResolving(false);
    }
  };

  const confirmRunner = async () => {
    if (!selectedCandidate) {
      return;
    }
    setIsConfirming(true);
    try {
      await onConfirm(selectedCandidate, nickname.trim());
      reset();
      onClose();
    } catch (error: unknown) {
      const response = (
        error as { response?: { data?: { detail?: string; message?: string } } }
      )?.response;
      notifications.show({
        message: (
          response?.data?.detail
          || response?.data?.message
          || '添加失败，请稍后重试'
        ),
        color: 'red',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        reset();
        onClose();
      }}
      title="添加选手"
      centered
    >
      <Stack gap="md">
        <Stack gap="sm">
          <TextInput
            label="号码布"
            placeholder="请输入号码布（必填）"
            value={bibNumber}
            onChange={(event) => setBibNumber(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void resolveRunner();
              }
            }}
            leftSection={<IconSearch size={16} />}
            error={resolveError}
            required
          />
          <Select
            label="组别（可选）"
            placeholder="不选择则查询所有公开组别"
            clearable
            searchable
            data={groupOptions}
            value={groupId}
            onChange={setGroupId}
          />
          <Button
            onClick={() => void resolveRunner()}
            loading={isResolving}
            fullWidth
          >
            查询号码布
          </Button>
        </Stack>

        {candidates.length > 0 && (
          <Stack gap="sm">
            <Text fw={600}>搜索结果</Text>
            {candidates.length > 1 && !selectedCandidate && (
              <>
                <Text size="sm" c="dimmed">
                  该号码布匹配多个公开组别，请选择一个：
                </Text>
                {candidates.map((candidate) => (
                  <Button
                    key={candidate.resolutionToken}
                    variant="light"
                    justify="space-between"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <Avatar
                        src={candidate.avatarUrl || undefined}
                        alt={candidate.name || '选手'}
                        size="sm"
                        radius="xl"
                      >
                        {(candidate.name || '?').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Text size="sm">
                          {candidate.groupName} · {candidate.name || '姓名待定'}
                        </Text>
                        <RunnerProfileMeta profile={candidate} compact />
                      </Box>
                    </Group>
                  </Button>
                ))}
              </>
            )}

            {selectedCandidate && (
              <>
                <Paper withBorder p="sm">
                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    <Avatar
                      src={selectedCandidate.avatarUrl || undefined}
                      alt={selectedCandidate.name || '选手'}
                      size="lg"
                      radius="xl"
                    >
                      {(selectedCandidate.name || '?').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Text fw={600}>
                        {selectedCandidate.name || '姓名待定'}
                      </Text>
                      <Text size="sm" c="dimmed">
                        #{selectedCandidate.bibNumber} · {selectedCandidate.groupName}
                      </Text>
                      <RunnerProfileMeta profile={selectedCandidate} />
                    </Box>
                  </Group>
                  {selectedCandidate.preview.checkpoints.length > 0 && (
                    <Text size="xs" c="dimmed" mt="xs">
                      最近检查点：
                      {selectedCandidate.preview.checkpoints.at(-1)?.name}
                    </Text>
                  )}
                </Paper>
                {showNickname && (
                  <TextInput
                    label="昵称（可选）"
                    placeholder="你熟悉的名字或绰号"
                    value={nickname}
                    onChange={(event) => setNickname(event.currentTarget.value)}
                    maxLength={128}
                  />
                )}
                <Group justify="flex-end">
                  {candidates.length > 1 && (
                    <Button
                      variant="default"
                      onClick={() => {
                        setSelectedCandidate(null);
                        setNickname('');
                      }}
                    >
                      返回选择
                    </Button>
                  )}
                  <Button
                    onClick={() => void confirmRunner()}
                    loading={isConfirming}
                  >
                    {confirmLabel}
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
};

export default RunnerSearchModal;
