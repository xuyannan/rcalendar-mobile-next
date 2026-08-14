import {
  Alert,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconCopy,
  IconLogin,
  IconPlus,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import request from '../../utils/request';
import { STORAGE_USER_TOKEN } from '../../constants';
import RunnerCard from './components/RunnerCard';
import RunnerSearchModal from './components/RunnerSearchModal';
import type {
  LocalTrackingEntry,
  ResolutionCandidate,
  SharedTrackingResponse,
} from './types';
import {
  formatEventDateTime,
  getGroupState,
  groupStateLabel,
  readLocalTracking,
  sortTrackingGroups,
  upsertLocalTracking,
  writeLocalTracking,
} from './utils';

const REFRESH_INTERVAL = 60_000;

const getErrorMessage = (error: unknown, fallback: string) => {
  const response = (
    error as { response?: { data?: { detail?: string; message?: string } } }
  )?.response;
  return response?.data?.detail || response?.data?.message || fallback;
};

interface SharedTrackingBoardProps {
  eventId?: string;
  shareToken?: string;
}

const SharedTrackingBoard = ({
  eventId: eventIdProp,
  shareToken: shareTokenProp,
}: SharedTrackingBoardProps) => {
  const { id: routeEventId, shareToken: routeShareToken } = useParams<{
    id?: string;
    shareToken?: string;
  }>();
  const [searchParams] = useSearchParams();
  const shareToken = shareTokenProp
    || searchParams.get('board')
    || routeShareToken;
  const eventId = eventIdProp || routeEventId;
  const isLegacyRoute = (
    !shareTokenProp
    && !searchParams.get('board')
    && Boolean(routeShareToken)
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = Boolean(
    localStorage.getItem(STORAGE_USER_TOKEN),
  );
  const [now, setNow] = useState(() => Date.now());
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copyPromptOpened, setCopyPromptOpened] = useState(false);
  const [copyDestination, setCopyDestination] =
    useState<'account' | 'browser'>('browser');
  const [isClosing, setIsClosing] = useState(false);
  const [removingRunnerId, setRemovingRunnerId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['sharedTrackingBoard', shareToken],
    queryFn: async () => request.get(
      `/api/v2/tracking-boards/${shareToken}/`,
    ) as Promise<SharedTrackingResponse>,
    enabled: Boolean(shareToken),
    refetchInterval: REFRESH_INTERVAL,
    refetchOnWindowFocus: false,
  });
  const errorMessage = getErrorMessage(
    error,
    '共享链接不存在或已关闭',
  );
  const isDeletedError = errorMessage === '共享列表已删除';

  useEffect(() => {
    if (isLegacyRoute && data?.board.eventId && data.board.shareToken) {
      navigate(
        `/events/${data.board.eventId}/tracking?board=${
          encodeURIComponent(data.board.shareToken)
        }`,
        { replace: true },
      );
    }
  }, [data, isLegacyRoute, navigate]);

  useEffect(() => {
    if (!isDeletedError || !eventId) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      navigate(`/events/${eventId}/tracking`, { replace: true });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [eventId, isDeletedError, navigate]);

  const sortedGroups = useMemo(
    () => sortTrackingGroups(data?.groups || [], now),
    [data?.groups, now],
  );

  const groupOptions = useMemo(
    () => (data?.groups || []).map((group) => ({
      value: String(group.id),
      label: group.name,
    })),
    [data?.groups],
  );

  const login = () => {
    const redirect = (
      eventId && shareToken
        ? `/events/${eventId}/tracking?board=${encodeURIComponent(shareToken)}`
        : `${window.location.pathname}${window.location.search}`
    );
    navigate(`/login?redirect_to=${encodeURIComponent(redirect)}`);
  };

  const copyToPersonalTracking = async () => {
    if (!data?.board || !data.board.eventId) {
      return;
    }
    setIsCopying(true);
    try {
      if (isAuthenticated && shareToken) {
        const response = await request.post(
          `/api/v2/tracking-boards/${shareToken}/copy/`,
          {},
        ) as { created: number };
        notifications.show({
          message: response.created > 0
            ? `已添加 ${response.created} 位选手到我的关注`
            : '这些选手已经在你的关注列表中',
          color: 'green',
        });
        setCopyDestination('account');
        setCopyPromptOpened(true);
        return;
      }

      const eventId = String(data.board.eventId);
      const currentEntries = readLocalTracking(eventId);
      const boardRunners = data.groups.flatMap((group) => group.runners);
      const nextEntries = boardRunners.reduce<LocalTrackingEntry[]>(
        (entries, runner) => upsertLocalTracking(entries, {
          runnerId: runner.id,
          eventGroupId: runner.eventGroupId,
          bibNumber: runner.bibNumber,
          nickname: runner.nickname || '',
        }),
        currentEntries,
      );
      writeLocalTracking(eventId, nextEntries);
      notifications.show({
        message: `已添加 ${boardRunners.length} 位选手到本浏览器的关注列表`,
        color: 'green',
      });
      setCopyDestination('browser');
      setCopyPromptOpened(true);
    } catch (copyError) {
      notifications.show({
        message: getErrorMessage(copyError, '复制关注列表失败，请稍后重试'),
        color: 'red',
      });
    } finally {
      setIsCopying(false);
    }
  };

  const addRunnerToBoard = async (
    candidate: ResolutionCandidate,
    nickname: string,
  ) => {
    if (!shareToken) {
      return;
    }
    await request.post(
      `/api/v2/tracking-boards/${shareToken}/runners/`,
      {
        resolutionToken: candidate.resolutionToken,
        nickname,
      },
    );
    await queryClient.invalidateQueries({
      queryKey: ['sharedTrackingBoard', shareToken],
    });
    notifications.show({
      message: '已添加到共享列表',
      color: 'green',
    });
  };

  const removeRunnerFromBoard = async (runnerId: number) => {
    if (!shareToken) {
      return;
    }
    setRemovingRunnerId(runnerId);
    try {
      await request.delete(
        `/api/v2/tracking-boards/${shareToken}/runners/${runnerId}/`,
      );
      await queryClient.invalidateQueries({
        queryKey: ['sharedTrackingBoard', shareToken],
      });
      notifications.show({
        message: '已从共享列表移除',
        color: 'green',
      });
    } catch (removeError) {
      notifications.show({
        message: getErrorMessage(removeError, '移除失败，请稍后重试'),
        color: 'red',
      });
    } finally {
      setRemovingRunnerId(null);
    }
  };

  const closeBoard = async () => {
    if (!shareToken || !data?.board.isOwner) {
      return;
    }
    setIsClosing(true);
    try {
      await request.patch(
        `/api/v2/tracking-boards/${shareToken}/`,
        { isActive: false },
      );
      notifications.show({
        message: '共享链接已关闭',
        color: 'green',
      });
      navigate(`/events/${data.board.eventId}/tracking`);
    } catch (closeError) {
      notifications.show({
        message: getErrorMessage(closeError, '关闭共享链接失败，请稍后重试'),
        color: 'red',
      });
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (isError || !data) {
    return (
      <Container size="sm" py="xl">
        <Stack>
          <Alert
            color="red"
            title={isDeletedError ? '共享列表已删除' : '无法加载共享列表'}
          >
            {isDeletedError
              ? '该共享列表已被创建者删除，页面将返回公共 tracking。'
              : errorMessage}
          </Alert>
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate(
              eventId ? `/events/${eventId}/tracking` : '/',
            )}
          >
            返回赛事追踪
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Box bg="gray.0" mih="100vh">
      <Container size="md" py="md">
        <Stack gap="md">
          <Paper withBorder p="lg" radius="lg">
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <Box>
                  <Text size="sm" c="dimmed">共享赛事追踪</Text>
                  <Title order={2}>{data.board.name}</Title>
                  <Text size="sm" c="dimmed" mt={4}>
                    {data.board.eventName}
                  </Text>
                </Box>
                <Button
                  variant="subtle"
                  size="compact-sm"
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => {
                    setNow(Date.now());
                    void refetch();
                  }}
                  loading={isFetching}
                >
                  刷新
                </Button>
              </Group>
              <Button
                variant="subtle"
                size="compact-sm"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate(
                  `/events/${data.board.eventId}/tracking`,
                )}
              >
                返回我的追踪
              </Button>
              <Text size="sm" c="dimmed">
                {formatEventDateTime(
                  data.event.date,
                  data.event.timezone,
                  data.event.dateBeijing,
                )} · 共 {data.board.runnerCount} 位选手
              </Text>
              <Alert color="indigo" title="当前正在查看共享列表">
                这是一个共享视图。复制到我的关注后，选手才会保存到你的个人列表；
                共享列表的添加和删除不会修改你的个人关注。
              </Alert>
              {!isAuthenticated && (
                <Alert
                  color="blue"
                  title="登录后跨设备保存关注"
                  icon={<IconLogin size={18} />}
                >
                  你可以直接查看并复制列表。登录后复制的选手会保存到你的账号。
                  <Button
                    mt="xs"
                    size="compact-sm"
                    variant="light"
                    onClick={login}
                  >
                    登录 / 注册
                  </Button>
                </Alert>
              )}
              <Group>
                <Button
                  leftSection={<IconCopy size={16} />}
                  onClick={() => void copyToPersonalTracking()}
                  loading={isCopying}
                >
                  复制到我的关注
                </Button>
                {data.board.canAdd && (
                  <Button
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    onClick={() => {
                      if (!isAuthenticated) {
                        login();
                        return;
                      }
                      setAddModalOpened(true);
                    }}
                  >
                    添加选手
                  </Button>
                )}
                {data.board.isOwner && (
                  <Button
                    variant="subtle"
                    color="red"
                    leftSection={<IconX size={16} />}
                    onClick={() => void closeBoard()}
                    loading={isClosing}
                  >
                    关闭分享
                  </Button>
                )}
              </Group>
            </Stack>
          </Paper>

          {sortedGroups.map((group) => {
            const state = getGroupState(group, now);
            return (
              <Stack key={group.id} gap="xs">
                <Group justify="space-between">
                  <Box>
                    <Title order={4}>{group.name}</Title>
                    <Text size="xs" c="dimmed">
                      {group.startAt
                        ? formatEventDateTime(
                          group.startAt,
                          data.event.timezone,
                          group.startAtBeijing,
                        )
                        : '时间待定'}
                      {group.distance
                        ? ` · ${group.distance}${group.distanceUnit || 'km'}`
                        : ''}
                    </Text>
                  </Box>
                  <Text size="sm" c="dimmed">
                    {groupStateLabel[state]}
                  </Text>
                </Group>
                {group.runners.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    {group.runners.map((runner) => (
                      <RunnerCard
                        key={runner.id}
                        runner={runner}
                        groupName={group.name}
                        eventTimezone={data.event.timezone}
                        canRemove={data.board.isOwner}
                        isRemoving={removingRunnerId === runner.id}
                        onRemove={() => void removeRunnerFromBoard(runner.id)}
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <Paper withBorder p="md" radius="md">
                    <Text size="sm" c="dimmed">暂无共享选手</Text>
                  </Paper>
                )}
              </Stack>
            );
          })}
        </Stack>
      </Container>

      {data.board.canAdd && isAuthenticated && shareToken && (
        <RunnerSearchModal
          opened={addModalOpened}
          eventId={String(data.board.eventId)}
          groupOptions={groupOptions}
          onClose={() => setAddModalOpened(false)}
          onConfirm={addRunnerToBoard}
          confirmLabel="添加到共享列表"
          showNickname={false}
        />
      )}

      <Modal
        opened={copyPromptOpened}
        onClose={() => setCopyPromptOpened(false)}
        title="复制完成"
        centered
      >
        <Stack>
          <Text>
            {copyDestination === 'account'
              ? '共享列表中的选手已加入你的账号关注列表。'
              : '共享列表中的选手已保存到本浏览器的关注列表。'}
          </Text>
          <Text size="sm" c="dimmed">
            你可以继续查看共享列表，也可以返回总 tracking 页面管理自己的关注。
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setCopyPromptOpened(false)}
            >
              继续查看
            </Button>
            <Button
              onClick={() => {
                setCopyPromptOpened(false);
                navigate(`/events/${data.board.eventId}/tracking`);
              }}
            >
              去我的追踪
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default SharedTrackingBoard;
