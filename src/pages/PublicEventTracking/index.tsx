import {
  Alert,
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCopy,
  IconEdit,
  IconLogin,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShare,
  IconTrash,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import request from '../../utils/request';
import { STORAGE_USER_TOKEN } from '../../constants';
import RunnerCard, { RunnerProfileMeta } from './components/RunnerCard';
import SharedTrackingBoard from './SharedTrackingBoard';
import type {
  ConfirmResponse,
  LocalTrackingEntry,
  PublicTrackingGroup,
  PublicTrackingResponse,
  ResolutionCandidate,
  ResolveResponse,
  SyncResponse,
  TrackingBoardAddPolicy,
  TrackingBoardListResponse,
  TrackingBoardSummary,
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

type TrackingBoardCreateMode = 'empty' | 'selected';

const getErrorMessage = (error: unknown, fallback: string) => {
  const response = (
    error as { response?: { data?: { detail?: string; message?: string } } }
  )?.response;
  return response?.data?.detail || response?.data?.message || fallback;
};

const PublicEventTracking = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('board');

  if (shareToken) {
    return (
      <SharedTrackingBoard
        eventId={eventId}
        shareToken={shareToken}
      />
    );
  }

  return <PersonalTrackingPage />;
};

const PersonalTrackingPage = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = Boolean(
    localStorage.getItem(STORAGE_USER_TOKEN),
  );
  const [localEntries, setLocalEntries] = useState<LocalTrackingEntry[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [bibNumber, setBibNumber] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ResolutionCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<
    ResolutionCandidate | null
  >(null);
  const [nickname, setNickname] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [removingRunnerId, setRemovingRunnerId] = useState<number | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [shareModalOpened, setShareModalOpened] = useState(false);
  const [shareName, setShareName] = useState('');
  const [shareCreateMode, setShareCreateMode] =
    useState<TrackingBoardCreateMode>('empty');
  const [selectedShareRunnerIds, setSelectedShareRunnerIds] = useState<number[]>(
    [],
  );
  const [shareAddPolicy, setShareAddPolicy] =
    useState<TrackingBoardAddPolicy>('owner_only');
  const [shareToken, setShareToken] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [editingBoard, setEditingBoard] =
    useState<TrackingBoardSummary | null>(null);
  const [editingBoardName, setEditingBoardName] = useState('');
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const [deletingBoard, setDeletingBoard] =
    useState<TrackingBoardSummary | null>(null);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (eventId) {
      setLocalEntries(readLocalTracking(eventId));
    }
  }, [eventId]);

  useEffect(() => {
    syncAttempted.current = false;
  }, [eventId, isAuthenticated]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const runnerIds = useMemo(
    () => localEntries.map((entry) => entry.runnerId).join(','),
    [localEntries],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['publicEventTracking', eventId, runnerIds, isAuthenticated],
    queryFn: async () => {
      const query = runnerIds ? `?runner_ids=${runnerIds}` : '';
      return request.get(
        `/api/v2/events/${eventId}/public-tracking/${query}`,
      ) as Promise<PublicTrackingResponse>;
    },
    enabled: Boolean(eventId),
    refetchInterval: REFRESH_INTERVAL,
    refetchOnWindowFocus: false,
  });

  const {
    data: myBoards = [],
    isFetching: isFetchingBoards,
    refetch: refetchBoards,
  } = useQuery({
    queryKey: ['trackingBoards', eventId, isAuthenticated],
    queryFn: async () => request.get(
      `/api/v2/events/${eventId}/tracking-boards/`,
    ) as Promise<TrackingBoardListResponse>,
    enabled: Boolean(eventId && isAuthenticated),
    refetchOnWindowFocus: false,
  });

  const syncLocalEntries = useCallback(async () => {
    if (
      !eventId
      || !isAuthenticated
      || localEntries.length === 0
      || syncAttempted.current
    ) {
      return;
    }

    syncAttempted.current = true;
    setIsSyncing(true);
    try {
      const response = await request.post(
        `/api/v2/events/${eventId}/public-tracking/sync/`,
        {
          items: localEntries.map((entry) => ({
            runnerId: entry.runnerId,
            nickname: entry.nickname,
          })),
        },
      ) as SyncResponse;
      const syncedIds = new Set(
        response.syncedRunnerIds || response.synced_runner_ids || [],
      );
      const remaining = localEntries.filter(
        (entry) => !syncedIds.has(entry.runnerId),
      );
      setLocalEntries(remaining);
      writeLocalTracking(eventId, remaining);
      if (syncedIds.size > 0) {
        notifications.show({
          message: `已同步 ${syncedIds.size} 位本地关注选手`,
          color: 'green',
        });
        await queryClient.invalidateQueries({
          queryKey: ['publicEventTracking', eventId],
        });
      }
    } catch (syncError) {
      syncAttempted.current = false;
      notifications.show({
        message: getErrorMessage(syncError, '本地关注同步失败，请稍后重试'),
        color: 'red',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [eventId, isAuthenticated, localEntries, queryClient]);

  useEffect(() => {
    void syncLocalEntries();
  }, [syncLocalEntries]);

  const displayGroups = useMemo(() => {
    if (!data || isAuthenticated || localEntries.length === 0) {
      return data?.groups || [];
    }
    const nicknameByRunnerId = new Map(
      localEntries.map((entry) => [entry.runnerId, entry.nickname]),
    );
    return data.groups.map((group) => ({
      ...group,
      runners: group.runners.map((runner) => ({
        ...runner,
        nickname: nicknameByRunnerId.get(runner.id) || runner.nickname,
      })),
    }));
  }, [data, isAuthenticated, localEntries]);

  const sortedGroups = useMemo(
    () => sortTrackingGroups(displayGroups, now),
    [displayGroups, now],
  );

  const hasTrackedRunners = useMemo(
    () => sortedGroups.some((group) => group.runners.length > 0),
    [sortedGroups],
  );

  const groupOptions = useMemo(
    () => (data?.groups || []).map((group) => ({
      value: String(group.id),
      label: group.name,
    })),
    [data?.groups],
  );

  const availableShareRunners = useMemo(
    () => sortedGroups.flatMap((group) => group.runners),
    [sortedGroups],
  );

  const buildShareLink = (board: TrackingBoardSummary) =>
    `${window.location.origin}/events/${board.eventId}/tracking?board=${
      encodeURIComponent(board.shareToken)
    }`;

  const openAddModal = () => {
    setBibNumber('');
    setGroupId(null);
    setResolveError(null);
    setCandidates([]);
    setSelectedCandidate(null);
    setNickname('');
    setModalOpened(true);
  };

  const closeAddModal = () => {
    setModalOpened(false);
    setBibNumber('');
    setGroupId(null);
    setResolveError(null);
    setCandidates([]);
    setSelectedCandidate(null);
    setNickname('');
  };

  const resolveRunner = async () => {
    if (!eventId) {
      return;
    }
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
        { skipAuth: true },
      ) as ResolveResponse;
      if (!response.candidates?.length) {
        setResolveError('未找到该号码布的选手');
        return;
      }
      setCandidates(response.candidates);
      setSelectedCandidate(
        response.candidates.length === 1 ? response.candidates[0] : null,
      );
      setNickname('');
      setModalOpened(true);
    } catch (resolveRequestError) {
      setResolveError(
        getErrorMessage(resolveRequestError, '查询失败，请稍后重试'),
      );
    } finally {
      setIsResolving(false);
    }
  };

  const confirmRunner = async () => {
    if (!eventId || !selectedCandidate) {
      return;
    }
    setIsConfirming(true);
    try {
      const response = await request.post(
        `/api/v2/events/${eventId}/public-tracking/confirm/`,
        {
          resolutionToken: selectedCandidate.resolutionToken,
          nickname: nickname.trim(),
        },
      ) as ConfirmResponse;

      if (!isAuthenticated) {
        const nextEntry: LocalTrackingEntry = {
          runnerId: response.runnerId,
          eventGroupId: selectedCandidate.groupId,
          bibNumber: selectedCandidate.bibNumber,
          nickname: nickname.trim(),
        };
        const nextEntries = upsertLocalTracking(localEntries, nextEntry);
        setLocalEntries(nextEntries);
        writeLocalTracking(eventId, nextEntries);
      }

      closeAddModal();
      await queryClient.invalidateQueries({
        queryKey: ['publicEventTracking', eventId],
      });
      notifications.show({
        message: '已添加到关注列表',
        color: 'green',
      });
    } catch (confirmError) {
      notifications.show({
        message: getErrorMessage(confirmError, '添加失败，请稍后重试'),
        color: 'red',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const removeRunner = async (runnerId: number) => {
    if (!eventId) {
      return;
    }
    setRemovingRunnerId(runnerId);
    try {
      if (isAuthenticated) {
        await request.delete(
          `/api/v2/events/${eventId}/public-tracking/subscriptions/${runnerId}/`,
        );
      } else {
        const remaining = localEntries.filter(
          (entry) => entry.runnerId !== runnerId,
        );
        setLocalEntries(remaining);
        writeLocalTracking(eventId, remaining);
      }
      await queryClient.invalidateQueries({
        queryKey: ['publicEventTracking', eventId],
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

  const login = () => {
    const redirect = `${window.location.pathname}${window.location.search}`;
    navigate(`/login?redirect_to=${encodeURIComponent(redirect)}`);
  };

  const openShareModal = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setShareLink('');
    setShareToken('');
    setShareName('');
    setShareCreateMode('empty');
    setSelectedShareRunnerIds([]);
    setShareAddPolicy('owner_only');
    setShareModalOpened(true);
  };

  const createShareBoard = async () => {
    if (!eventId) {
      return;
    }
    const runnerIds = shareCreateMode === 'selected'
      ? selectedShareRunnerIds
      : [];
    if (shareCreateMode === 'selected' && runnerIds.length === 0) {
      notifications.show({
        message: '请至少选择一位关注选手',
        color: 'blue',
      });
      return;
    }

    setIsCreatingShare(true);
    try {
      const board = await request.post(
        `/api/v2/events/${eventId}/tracking-boards/`,
        {
          name: shareName.trim() || undefined,
          runnerIds,
          addPolicy: shareAddPolicy,
        },
      ) as TrackingBoardSummary;
      setShareToken(board.shareToken);
      setShareLink(buildShareLink(board));
      await refetchBoards();
      notifications.show({
        message: '共享链接已生成',
        color: 'green',
      });
    } catch (createError) {
      notifications.show({
        message: getErrorMessage(createError, '生成共享链接失败，请稍后重试'),
        color: 'red',
      });
    } finally {
      setIsCreatingShare(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      notifications.show({
        message: '共享链接已复制',
        color: 'green',
      });
    } catch {
      notifications.show({
        message: '复制失败，请手动复制链接',
        color: 'orange',
      });
    }
  };

  const copyBoardLink = async (board: TrackingBoardSummary) => {
    try {
      await navigator.clipboard.writeText(buildShareLink(board));
      notifications.show({
        message: '共享链接已复制',
        color: 'green',
      });
    } catch {
      notifications.show({
        message: '复制失败，请手动打开共享列表后复制链接',
        color: 'orange',
      });
    }
  };

  const openBoard = (board: TrackingBoardSummary) => {
    if (!board.isActive) {
      return;
    }
    navigate(
      `/events/${board.eventId}/tracking?board=${
        encodeURIComponent(board.shareToken)
      }`,
    );
  };

  const startEditingBoard = (board: TrackingBoardSummary) => {
    setEditingBoard(board);
    setEditingBoardName(board.name);
  };

  const saveBoardName = async () => {
    if (!editingBoard || !editingBoardName.trim()) {
      return;
    }
    setIsSavingBoard(true);
    try {
      await request.patch(
        `/api/v2/tracking-boards/${editingBoard.shareToken}/`,
        { name: editingBoardName.trim() },
      );
      await refetchBoards();
      setEditingBoard(null);
      notifications.show({
        message: '共享列表名称已更新',
        color: 'green',
      });
    } catch (saveError) {
      notifications.show({
        message: getErrorMessage(saveError, '修改名称失败，请稍后重试'),
        color: 'red',
      });
    } finally {
      setIsSavingBoard(false);
    }
  };

  const confirmDeleteBoard = async () => {
    if (!deletingBoard) {
      return;
    }
    setIsDeletingBoard(true);
    try {
      await request.delete(
        `/api/v2/tracking-boards/${deletingBoard.shareToken}/`,
      );
      await refetchBoards();
      setDeletingBoard(null);
      notifications.show({
        message: '共享列表已删除',
        color: 'green',
      });
    } catch (deleteError) {
      notifications.show({
        message: getErrorMessage(deleteError, '删除共享列表失败，请稍后重试'),
        color: 'red',
      });
    } finally {
      setIsDeletingBoard(false);
    }
  };

  const renderSearchForm = () => (
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
  );

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
        <Alert color="red" title="无法加载赛事">
          {getErrorMessage(error, '赛事暂未开放公共追踪')}
        </Alert>
      </Container>
    );
  }

  return (
    <Box bg="gray.0" mih="100vh">
      <Container size="md" py="md">
        <Stack gap="md">
          <Paper withBorder p="lg" radius="lg">
            <Stack gap="xs">
              <Group justify="space-between" align="flex-start">
                <Box>
                  <Text size="sm" c="dimmed">赛事追踪</Text>
                  <Title order={2}>{data.event.name}</Title>
                </Box>
                <Stack gap="xs" align="flex-end">
                  {/* <Badge variant="light">
                    {formatEventDateTime(
                      data.event.date,
                      data.event.timezone,
                      data.event.dateBeijing,
                    )}
                  </Badge> */}
                  <Button
                    variant="light"
                    size="compact-sm"
                    leftSection={<IconShare size={15} />}
                    onClick={openShareModal}
                  >
                    分享列表
                  </Button>
                </Stack>
              </Group>
              <Text size="sm" c="dimmed">
                这是你的个人关注列表。分享链接会以<b>共享模式</b>打开，不会替换你的关注列表。
              </Text>
            </Stack>
          </Paper>

          {!isAuthenticated && (
            <Alert
              color="blue"
              title="登录后跨设备保存关注"
              icon={<IconLogin size={18} />}
            >
              当前关注保存在本浏览器。登录后会自动同步到你的账号。
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
          {isAuthenticated && isSyncing && (
            <Alert color="blue">正在同步本地关注...</Alert>
          )}

          {isAuthenticated && (
            <Card withBorder radius="lg" padding="lg">
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Box>
                    <Title order={4}>我的共享列表</Title>
                    <Text size="sm" c="dimmed">
                      共享列表与我的关注相互独立，可单独添加选手。
                    </Text>
                  </Box>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    leftSection={<IconRefresh size={16} />}
                    onClick={() => void refetchBoards()}
                    loading={isFetchingBoards}
                  >
                    刷新
                  </Button>
                </Group>
                {myBoards.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    还没有共享列表，可点击上方“分享列表”创建一个空列表。
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {myBoards.map((board) => (
                      <Paper key={board.id} withBorder p="sm" radius="md">
                        <Group
                          justify="space-between"
                          align="flex-start"
                          wrap="wrap"
                        >
                          <Box>
                            <Group gap="xs">
                              <Text fw={600}>{board.name}</Text>
                              <Badge
                                color={board.isActive ? 'green' : 'gray'}
                                variant="light"
                              >
                                {board.isActive ? '开放中' : '已关闭'}
                              </Badge>
                            </Group>
                            <Text size="xs" c="dimmed" mt={4}>
                              {board.runnerCount} 位选手 ·
                              {board.addPolicy === 'members'
                                ? '允许成员添加'
                                : '仅创建者管理'}
                            </Text>
                          </Box>
                          <Group gap="xs">
                            <Button
                              variant="light"
                              size="compact-sm"
                              disabled={!board.isActive}
                              onClick={() => openBoard(board)}
                            >
                              打开
                            </Button>
                            <ActionIcon
                              variant="subtle"
                              aria-label={`编辑${board.name}`}
                              onClick={() => startEditingBoard(board)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              aria-label={`删除${board.name}`}
                              onClick={() => setDeletingBoard(board)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              aria-label={`复制${board.name}链接`}
                              disabled={!board.isActive}
                              onClick={() => void copyBoardLink(board)}
                            >
                              <IconCopy size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          )}

          {!hasTrackedRunners && (
            <Card withBorder radius="lg" padding="lg">
              <Stack gap="sm">
                <Group gap="xs">
                  <IconPlus size={20} />
                  <Title order={4}>添加选手</Title>
                </Group>
                <Text size="sm" c="dimmed">
                  输入号码布，查询并添加需要关注的选手。
                </Text>
                {renderSearchForm()}
              </Stack>
            </Card>
          )}

          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Title order={3}>我的关注</Title>
              {hasTrackedRunners && (
                <ActionIcon
                  variant="light"
                  aria-label="添加选手"
                  onClick={openAddModal}
                >
                  <IconPlus size={18} />
                </ActionIcon>
              )}
            </Group>
            <Button
              variant="subtle"
              size="compact-sm"
              leftSection={<IconRefresh size={16} />}
              onClick={() => void refetch()}
              loading={isFetching}
            >
              刷新
            </Button>
          </Group>

          {sortedGroups.map((group: PublicTrackingGroup) => {
            const state = getGroupState(group, now);
            return (
              <Stack key={group.id} gap="xs">
                <Group justify="space-between">
                  <Box>
                    <Title order={4}>{group.name}</Title>
                    <Text size="xs" c="dimmed">
                      {formatEventDateTime(
                        group.startAt,
                        data.event.timezone,
                        group.startAtBeijing,
                      )}
                      {group.distance
                        ? ` · ${group.distance}${group.distanceUnit || 'km'}`
                        : ''}
                    </Text>
                  </Box>
                  <Badge
                    color={
                      state === 'ongoing'
                        ? 'blue'
                        : state === 'finished'
                          ? 'gray'
                          : 'orange'
                    }
                    variant="light"
                  >
                    {groupStateLabel[state]}
                  </Badge>
                </Group>
                {group.runners.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    {group.runners.map((runner) => (
                      <RunnerCard
                        key={runner.id}
                        runner={runner}
                        groupName={group.name}
                        eventTimezone={data.event.timezone}
                        canRemove
                        isRemoving={removingRunnerId === runner.id}
                        onRemove={() => void removeRunner(runner.id)}
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <Paper withBorder p="md" radius="md">
                    <Text size="sm" c="dimmed">
                      暂无关注选手，可通过上方号码布添加。
                    </Text>
                  </Paper>
                )}
              </Stack>
            );
          })}
        </Stack>
      </Container>

      <Modal
        opened={modalOpened}
        onClose={closeAddModal}
        title="添加选手"
        centered
      >
        <Stack gap="md">
          {renderSearchForm()}
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
                  <TextInput
                    label="昵称（可选）"
                    placeholder="你熟悉的名字或绰号"
                    value={nickname}
                    onChange={(event) => setNickname(event.currentTarget.value)}
                    maxLength={128}
                  />
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
                      添加到我的关注
                    </Button>
                  </Group>
                </>
              )}
            </Stack>
          )}
        </Stack>
      </Modal>

      <Modal
        opened={shareModalOpened}
        onClose={() => setShareModalOpened(false)}
        title="分享关注列表"
        centered
      >
        <Stack>
          {!shareLink ? (
            <>
              <Text size="sm" c="dimmed">
                共享列表与我的关注相互独立，可以创建空列表，也可以选择部分关注选手。
              </Text>
              <TextInput
                label="列表名称"
                placeholder="例如：UTMB 团队追踪"
                value={shareName}
                onChange={(event) => setShareName(event.currentTarget.value)}
                maxLength={128}
              />
              <Radio.Group
                label="创建方式"
                value={shareCreateMode}
                onChange={(value) => {
                  if (value === 'empty' || value === 'selected') {
                    setShareCreateMode(value);
                  }
                }}
              >
                <Stack gap="xs" mt="xs">
                  <Radio
                    value="empty"
                    label="新建空列表，之后在共享页中添加选手"
                  />
                  <Radio
                    value="selected"
                    label={`从我的关注中选择（当前 ${availableShareRunners.length} 位）`}
                  />
                </Stack>
              </Radio.Group>
              {shareCreateMode === 'selected' && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    选择要加入共享列表的选手
                  </Text>
                  {availableShareRunners.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      当前还没有关注选手，请选择新建空列表。
                    </Text>
                  ) : (
                    availableShareRunners.map((runner) => (
                      <Checkbox
                        key={runner.id}
                        label={`${runner.nickname || runner.name || '未知选手'} · #${runner.bibNumber}`}
                        checked={selectedShareRunnerIds.includes(runner.id)}
                        onChange={(event) => {
                          const { checked } = event.currentTarget;
                          setSelectedShareRunnerIds((current) => (
                            checked
                              ? [...new Set([...current, runner.id])]
                              : current.filter((id) => id !== runner.id)
                          ));
                        }}
                      />
                    ))
                  )}
                </Stack>
              )}
              <Select
                label="成员权限"
                data={[
                  { value: 'owner_only', label: '仅查看，可复制到个人列表' },
                  { value: 'members', label: '允许登录成员添加选手' },
                ]}
                value={shareAddPolicy}
                onChange={(value) => {
                  if (value === 'owner_only' || value === 'members') {
                    setShareAddPolicy(value);
                  }
                }}
              />
              <Button
                onClick={() => void createShareBoard()}
                loading={isCreatingShare}
                fullWidth
              >
                生成共享链接
              </Button>
            </>
          ) : (
            <>
              <Text size="sm" c="dimmed">
                其他人打开后可以查看这组追踪数据，并复制到自己的关注列表。
              </Text>
              <TextInput
                label="共享链接"
                value={shareLink}
                readOnly
                rightSection={
                  <ActionIcon
                    variant="subtle"
                    aria-label="复制共享链接"
                    onClick={() => void copyShareLink()}
                  >
                    <IconShare size={16} />
                  </ActionIcon>
                }
              />
              <Group justify="flex-end">
                <Button
                  variant="default"
                  onClick={() => setShareModalOpened(false)}
                >
                  返回我的关注
                </Button>
                {shareToken && (
                  <Button
                    variant="light"
                    onClick={() => {
                      setShareModalOpened(false);
                      navigate(
                        `/events/${eventId}/tracking?board=${
                          encodeURIComponent(shareToken)
                        }`,
                      );
                    }}
                  >
                    打开共享列表
                  </Button>
                )}
                <Button onClick={() => void copyShareLink()}>
                  复制链接
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>

      <Modal
        opened={Boolean(editingBoard)}
        onClose={() => setEditingBoard(null)}
        title="编辑共享列表"
        centered
      >
        <Stack>
          <TextInput
            label="列表名称"
            value={editingBoardName}
            onChange={(event) => setEditingBoardName(event.currentTarget.value)}
            maxLength={128}
            required
          />
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setEditingBoard(null)}
            >
              取消
            </Button>
            <Button
              onClick={() => void saveBoardName()}
              loading={isSavingBoard}
              disabled={!editingBoardName.trim()}
            >
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={Boolean(deletingBoard)}
        onClose={() => setDeletingBoard(null)}
        title="删除共享列表"
        centered
      >
        <Stack>
          <Text>
            确定删除“{deletingBoard?.name}”吗？
          </Text>
          <Text size="sm" c="dimmed">
            删除后，原分享链接将提示列表已删除，并返回公共 tracking。
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setDeletingBoard(null)}
            >
              取消
            </Button>
            <Button
              color="red"
              onClick={() => void confirmDeleteBoard()}
              loading={isDeletingBoard}
            >
              删除
            </Button>
          </Group>
        </Stack>
      </Modal>

    </Box>
  );
};

export default PublicEventTracking;
