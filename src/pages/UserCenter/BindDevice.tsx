import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Badge, Button, Group, SimpleGrid, Title, Avatar, Stack, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBrandStrava, IconDeviceWatch, IconCheck, IconLink, IconRun, IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import request from '../../utils/request';
import type { ThirdPartyAccount } from '../../types/user';
import {
  STRAVA_APPID,
  COROS_CLIENT_ID,
  COROS_AUTH_URL,
  COROS_REDIRECT_URI,
} from '../../constants';

interface DeviceConfig {
  provider: 'Strava' | 'Garmin' | 'Coros';
  name: string;
  icon: typeof IconBrandStrava;
  color: string;
  getAuthUrl: () => string;
}

const devices: DeviceConfig[] = [
  {
    provider: 'Strava',
    name: 'Strava',
    icon: IconBrandStrava,
    color: 'orange',
    getAuthUrl: () => {
      const redirectUri = encodeURIComponent(`${window.location.origin}/strava_callback`);
      return `https://www.strava.com/oauth/authorize?client_id=${STRAVA_APPID}&response_type=code&redirect_uri=${redirectUri}&scope=read,activity:read_all`;
    },
  },
  {
    provider: 'Garmin',
    name: 'Garmin',
    icon: IconDeviceWatch,
    color: 'blue',
    getAuthUrl: () => {
      return '/bind_garmin';
    },
  },
  {
    provider: 'Coros',
    name: 'Coros',
    icon: IconDeviceWatch,
    color: 'teal',
    getAuthUrl: () => {
      const redirectUri = encodeURIComponent(COROS_REDIRECT_URI);
      const state = Math.random().toString(36).substring(7);
      localStorage.setItem('coros_state', state);
      return `${COROS_AUTH_URL}?client_id=${COROS_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&state=${state}`;
    },
  },
];

export default function BindDevice() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<ThirdPartyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [unbindModalOpened, { open: openUnbindModal, close: closeUnbindModal }] = useDisclosure(false);
  const [unbindingAccount, setUnbindingAccount] = useState<{ id: number; provider: string } | null>(null);
  const [unbinding, setUnbinding] = useState(false);
  const [backfilling, setBackfilling] = useState<string | null>(null);

  useEffect(() => {
    request({ url: '/api/v2/users/my-third-party-accounts/', method: 'GET' })
      .then((res: unknown) => {
        const data = res as ThirdPartyAccount[];
        if (Array.isArray(data)) {
          setAccounts(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getAccountByProvider = (provider: string) => {
    return accounts.find((acc) => acc.provider === provider);
  };

  const handleBind = (device: DeviceConfig) => {
    const url = device.getAuthUrl();
    if (url) {
      if (url.startsWith('/')) {
        navigate(url);
      } else {
        window.location.assign(url);
      }
    }
  };

  const handleUnbind = async (accountId: number, provider: string) => {
    setUnbindingAccount({ id: accountId, provider });
    openUnbindModal();
  };

  const confirmUnbind = async () => {
    if (!unbindingAccount) return;
    
    setUnbinding(true);
    try {
      if (unbindingAccount.provider === 'Garmin') {
        await request({
          url: '/api/v2/auth/garmin-bind/',
          method: 'DELETE',
        });
      } else if (unbindingAccount.provider === 'Coros') {
        await request({
          url: '/api/v2/auth/coros-bind/',
          method: 'DELETE',
        });
      } else {
        await request({
          url: `/api/v2/third-party-accounts/${unbindingAccount.id}/`,
          method: 'DELETE',
        });
      }
      setAccounts(accounts.filter((acc) => acc.id !== unbindingAccount.id));
      closeUnbindModal();
    } catch {
      alert('解绑失败');
    } finally {
      setUnbinding(false);
      setUnbindingAccount(null);
    }
  };

  const handleBackfill = async (provider: string) => {
    setBackfilling(provider);
    try {
      const url = provider === 'Garmin' 
        ? '/api/v2/auth/garmin-backfill/' 
        : '/api/v2/auth/coros-backfill/';
      await request({ url, method: 'POST' });
      setAccounts(accounts.map((acc) => 
        acc.provider === provider ? { ...acc, backfillCompleted: true } : acc
      ));
      alert('运动数据将陆续同步至跑者日历，请耐心等待');
    } catch {
      alert('同步失败，请稍后重试');
    } finally {
      setBackfilling(null);
    }
  };

  if (loading) {
    return <Text>加载中...</Text>;
  }

  return (
    <div>
      <Title order={2} mb="lg">绑定设备</Title>
      <Text c="dimmed" mb="xl">
        绑定您的运动设备，自动同步运动数据
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {devices.map((device) => {
          const account = getAccountByProvider(device.provider);
          const isBound = !!account;

          return (
            <Card key={device.provider} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Group>
                  <Avatar color={device.color} radius="xl">
                    <device.icon size={24} />
                  </Avatar>
                  <div>
                    <Text fw={500}>{device.name}</Text>
                    {isBound && account.name && (
                      <Text size="xs" c="dimmed">{account.name}</Text>
                    )}
                  </div>
                </Group>
                <Badge color={isBound ? 'green' : 'gray'} variant="light">
                  {isBound ? '已绑定' : '未绑定'}
                </Badge>
              </Group>

              {isBound ? (
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm" c="dimmed">
                      绑定于 {new Date(account.createdAt).toLocaleDateString()}
                    </Text>
                  </Group>
                  {account.synced_at && (
                    <Text size="xs" c="dimmed">
                      最后同步: {new Date(account.syncedAt).toLocaleString()}
                    </Text>
                  )}
                  <Group gap="xs" mt="sm">
                    <Button
                      variant="light"
                      color="blue"
                      size="sm"
                      leftSection={<IconRun size={16} />}
                      onClick={() => navigate(`/user/workouts?provider=${device.provider}`)}
                    >
                      运动记录
                    </Button>
                    {(device.provider === 'Garmin' || device.provider === 'Coros') && !account.backfillCompleted && (
                      <Button
                        variant="light"
                        color="green"
                        size="sm"
                        leftSection={<IconRefresh size={16} />}
                        loading={backfilling === device.provider}
                        onClick={() => handleBackfill(device.provider)}
                      >
                        同步最近30天记录
                      </Button>
                    )}
                    <Button
                      variant="light"
                      color="red"
                      size="sm"
                      onClick={() => handleUnbind(account.id, device.provider)}
                    >
                      解绑
                    </Button>
                  </Group>
                </Stack>
              ) : (
                <Button
                  variant="light"
                  color={device.color}
                  fullWidth
                  mt="md"
                  leftSection={<IconLink size={16} />}
                  onClick={() => handleBind(device)}
                >
                  立即绑定
                </Button>
              )}
            </Card>
          );
        })}
      </SimpleGrid>

      <Modal
        opened={unbindModalOpened}
        onClose={closeUnbindModal}
        title={
          <Group gap="xs">
            <IconAlertTriangle size={20} color="orange" />
            <Text fw={500}>确认解绑</Text>
          </Group>
        }
        centered
      >
        <Stack>
          <Text>
            确定要解绑 {unbindingAccount?.provider} 账户吗？
          </Text>
          <Text c="red" size="sm">
            解绑后，之前从该平台同步的运动记录将会一并删除。
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeUnbindModal}>
              取消
            </Button>
            <Button color="red" loading={unbinding} onClick={confirmUnbind}>
              确认解绑
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
