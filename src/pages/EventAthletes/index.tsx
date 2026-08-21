import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowRight, IconSearch } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import request from '../../utils/request';
import { STORAGE_USER_TOKEN } from '../../constants';
import TrackingBrandHeader from '../PublicEventTracking/components/TrackingBrandHeader';
import {
  readLocalTracking,
  upsertLocalTracking,
  writeLocalTracking,
} from '../PublicEventTracking/utils';
import type {
  ConfirmResponse,
  LocalTrackingEntry,
  ResolutionCandidate,
  ResolveResponse,
} from '../PublicEventTracking/types';

interface Athlete {
  id: number;
  eventGroup: number;
  eventGroupName: string;
  bibNumber: string;
  name?: string;
  avatarUrl?: string;
  age?: number;
  ageGroup?: string;
  brand?: string;
  nationality?: string;
  countryCode?: string;
  sex?: string;
  status: string;
  isFollowed: boolean;
}

interface AthleteResponse {
  count: number;
  results: Athlete[];
}

interface BrandResponse {
  brands: string[];
}

interface EventResponse {
  name: string;
  groups?: Array<{ id: number; name: string }>;
}

const statusLabels: Record<string, string> = {
  not_started: '未开始',
  racing: '比赛中',
  finished: '已完赛',
  dns: 'DNS',
  dnf: 'DNF',
};

const sexLabels: Record<string, string> = {
  M: '男',
  H: '男',
  F: '女',
};

const sexOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

const getErrorMessage = (error: unknown) => (
  (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
  || '操作失败，请稍后重试'
);

const EventAthletes = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = Boolean(localStorage.getItem(STORAGE_USER_TOKEN));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [nationality, setNationality] = useState('');
  const [brand, setBrand] = useState<string | null>(null);
  const [sex, setSex] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    groupId: null as string | null,
    nationality: '',
    brand: null as string | null,
    sex: null as string | null,
  });
  const [localEntries, setLocalEntries] = useState<LocalTrackingEntry[]>(() => (
    eventId ? readLocalTracking(eventId) : []
  ));

  const eventQuery = useQuery({
    queryKey: ['public-athlete-event', eventId],
    queryFn: async () => request.get(
      `/api/v2/events/${eventId}/`,
    ) as Promise<EventResponse>,
    enabled: Boolean(eventId),
  });

  const brandsQuery = useQuery({
    queryKey: ['public-athlete-brands', eventId],
    queryFn: async () => request.get(
      `/api/v2/events/${eventId}/athletes/brands/`,
    ) as Promise<BrandResponse>,
    enabled: Boolean(eventId),
  });

  const athleteQuery = useQuery({
    queryKey: [
      'public-athletes',
      eventId,
      page,
      appliedFilters,
      isAuthenticated,
    ],
    queryFn: async () => request.get(
      `/api/v2/events/${eventId}/athletes/`,
      {
        ...(isAuthenticated ? {} : { skipAuth: true }),
        params: {
          page,
          pageSize: 30,
          search: appliedFilters.search || undefined,
          group_id: appliedFilters.groupId || undefined,
          nationality: appliedFilters.nationality || undefined,
          brand: appliedFilters.brand || undefined,
          sex: appliedFilters.sex || undefined,
        },
      },
    ) as Promise<AthleteResponse>,
    enabled: Boolean(eventId),
  });

  const submitSearch = () => {
    setPage(1);
    setAppliedFilters({
      search: search.trim(),
      groupId,
      nationality: nationality.trim(),
      brand,
      sex,
    });
  };

  const localRunnerIds = useMemo(
    () => new Set(localEntries.map((entry) => entry.runnerId)),
    [localEntries],
  );

  const addToTracking = async (athlete: Athlete) => {
    if (!eventId || addingId !== null) return;
    setAddingId(athlete.id);
    try {
      const resolved = await request.post(
        `/api/v2/events/${eventId}/public-tracking/resolve/`,
        {
          bibNumber: athlete.bibNumber,
          eventGroupId: athlete.eventGroup,
        },
        { skipAuth: true },
      ) as ResolveResponse;
      const candidate: ResolutionCandidate | undefined = resolved.candidates?.[0];
      if (!candidate) throw new Error('未找到该运动员');

      const confirmed = await request.post(
        `/api/v2/events/${eventId}/public-tracking/confirm/`,
        {
          resolutionToken: candidate.resolutionToken,
          nickname: '',
        },
      ) as ConfirmResponse;

      if (!isAuthenticated) {
        const nextEntry: LocalTrackingEntry = {
          runnerId: confirmed.runnerId,
          eventGroupId: athlete.eventGroup,
          bibNumber: athlete.bibNumber,
          nickname: '',
        };
        const nextEntries = upsertLocalTracking(localEntries, nextEntry);
        setLocalEntries(nextEntries);
        writeLocalTracking(eventId, nextEntries);
      }
      await queryClient.invalidateQueries({ queryKey: ['public-athletes', eventId] });
      notifications.show({ message: '已加入我的追踪', color: 'green' });
    } catch (error) {
      notifications.show({ message: getErrorMessage(error), color: 'red' });
    } finally {
      setAddingId(null);
    }
  };

  const groups = eventQuery.data?.groups || [];
  const athletes = athleteQuery.data?.results || [];

  return (
    <Box bg="gray.0" mih="100vh">
      <Container size="md" py="md">
        <TrackingBrandHeader />
        <Group justify="space-between" align="center" mb="md">
          <Box>
            <Text size="sm" c="dimmed">赛事运动员</Text>
            <Title order={2}>{eventQuery.data?.name || '运动员列表'}</Title>
          </Box>
          <Button
            variant="light"
            rightSection={<IconArrowRight size={16} />}
            onClick={() => navigate(`/events/${eventId}/tracking`)}
          >
            我的追踪
          </Button>
        </Group>

        <Card withBorder radius="lg" mb="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              placeholder="搜索姓名或 Bib"
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitSearch();
              }}
            />
            <Select
              clearable
              searchable
              placeholder="全部组别"
              data={groups.map((group) => ({
                value: String(group.id),
                label: group.name,
              }))}
              value={groupId}
              onChange={setGroupId}
            />
            <TextInput
              placeholder="国籍"
              value={nationality}
              onChange={(event) => setNationality(event.currentTarget.value)}
            />
            <Select
              clearable
              searchable
              placeholder="全部品牌"
              data={brandsQuery.data?.brands || []}
              value={brand}
              onChange={setBrand}
            />
            <Select
              clearable
              placeholder="全部性别"
              data={sexOptions}
              value={sex}
              onChange={setSex}
            />
            <Button
              leftSection={<IconSearch size={16} />}
              onClick={submitSearch}
              fullWidth
            >
              搜索
            </Button>
          </SimpleGrid>
        </Card>

        {athleteQuery.isLoading ? (
          <Center py="xl"><Loader /></Center>
        ) : (
          <>
            <Text size="sm" c="dimmed" mb="sm">
              共 {athleteQuery.data?.count || 0} 名运动员
            </Text>
            <Stack gap="sm">
              {athletes.map((athlete) => {
                const followed = athlete.isFollowed || localRunnerIds.has(athlete.id);
                return (
                  <Card key={athlete.id} withBorder radius="lg" padding="sm">
                    <Group wrap="nowrap" align="flex-start">
                      <Avatar src={athlete.avatarUrl} size="lg" radius="xl">
                        {(athlete.name || '?').slice(0, 1)}
                      </Avatar>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" wrap="nowrap">
                          <Text fw={600} truncate>{athlete.name || '-'}</Text>
                          <Button
                            size="compact-sm"
                            variant={followed ? 'light' : 'filled'}
                            disabled={followed}
                            loading={addingId === athlete.id}
                            onClick={() => void addToTracking(athlete)}
                          >
                            {followed ? '已追踪' : '加入追踪'}
                          </Button>
                        </Group>
                        <Text size="sm" c="dimmed">
                          #{athlete.bibNumber} · {athlete.eventGroupName}
                        </Text>
                        <Group gap="xs" mt={4}>
                          <Badge variant="light">
                            {athlete.nationality || athlete.countryCode || '-'}
                          </Badge>
                          <Badge variant="light">
                            {sexLabels[athlete.sex || ''] || athlete.sex || '-'}
                          </Badge>
                          <Badge variant="light">
                            {statusLabels[athlete.status] || athlete.status}
                          </Badge>
                          {athlete.ageGroup && (
                            <Badge variant="light">{athlete.ageGroup}</Badge>
                          )}
                          {athlete.brand && (
                            <Text size="xs" c="dimmed" truncate>{athlete.brand}</Text>
                          )}
                        </Group>
                      </Box>
                    </Group>
                  </Card>
                );
              })}
            </Stack>
            <Center mt="lg">
              <Pagination
                value={page}
                onChange={setPage}
                total={Math.max(1, Math.ceil((athleteQuery.data?.count || 0) / 30))}
              />
            </Center>
          </>
        )}
      </Container>
    </Box>
  );
};

export default EventAthletes;
