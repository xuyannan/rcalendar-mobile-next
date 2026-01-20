import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Container, Paper, Title, Text, Group, Button, Loader, Center, Box } from '@mantine/core';
import { IconArrowLeft, IconRefresh, IconRun } from '@tabler/icons-react';
import request from '../../utils/request';
import { HeaderMegaMenu } from '../../components/HeaderMegaMenu';
import EventHeader from './components/EventHeader';
import MapElevation from './components/MapElevation';
import TrackedRunnersTable from './components/TrackedRunnersTable';
import type { EventData } from './types';

const EventDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['eventDashboard', id],
    queryFn: async () => {
      const response = await request.get(`/api/v2/events/${id}/`);
      return response as unknown as EventData;
    },
    enabled: !!id,
  });

  const handleRefreshPage = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['eventDashboard', id] });
    setIsRefreshing(false);
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
      <Container py="xl">
        <Paper p="xl" ta="center">
          <Title order={4} mb="md">未找到赛事信息</Title>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box>
      <HeaderMegaMenu />
      <Box pt={50}>
        <Container size="xl" py="md">
          <Group justify="space-between" mb="md">
            <Button 
              variant="subtle" 
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate(-1)}
            >
              返回
            </Button>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefreshPage}
              loading={isRefreshing}
            >
              刷新数据
            </Button>
          </Group>

          <EventHeader event={data} />

          {data.groups && <MapElevation groups={data.groups} />}

          <Group justify="space-between" align="center" mb="md">
            <Group gap="xs">
              <IconRun size={20} />
              <Title order={4}>选手追踪</Title>
            </Group>
          </Group>

          {data.groups && data.groups.length > 0 ? (
            data.groups.map((group) => (
              <TrackedRunnersTable key={group.id} group={group} />
            ))
          ) : (
            <Paper p="xl" ta="center">
              <Text c="dimmed">暂无组别信息</Text>
            </Paper>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default EventDashboard;
