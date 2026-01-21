import { useEffect, useState } from 'react';
import { Card, Text, Badge, Button, Group, SimpleGrid, Title, Avatar, Stack } from '@mantine/core';
import { IconBrandStrava, IconDeviceWatch, IconCheck, IconLink } from '@tabler/icons-react';
import request from '../../utils/request';
import type { ThirdPartyAccount } from '../../types/user';
import {
  STRAVA_APPID,
  GARMIN_CLIENT_ID,
  GARMIN_AUTH_URL,
  GARMIN_REDIRECT_URI,
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

const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const generateCodeChallenge = async (verifier: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

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
      const codeVerifier = generateCodeVerifier();
      localStorage.setItem('garmin_code_verifier', codeVerifier);
      generateCodeChallenge(codeVerifier).then((challenge) => {
        const redirectUri = encodeURIComponent(GARMIN_REDIRECT_URI);
        window.location.href = `${GARMIN_AUTH_URL}?client_id=${GARMIN_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&code_challenge=${challenge}&code_challenge_method=S256&scope=GCS_READ_WORKOUT`;
      });
      return '';
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
  const [accounts, setAccounts] = useState<ThirdPartyAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request({ url: '/api/v2/users/me/', method: 'GET' })
      .then((res: unknown) => {
        const userData = res as { third_party_accounts?: ThirdPartyAccount[] };
        if (userData.third_party_accounts) {
          setAccounts(userData.third_party_accounts);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getAccountByProvider = (provider: string) => {
    return accounts.find((acc) => acc.provider === provider);
  };

  const handleBind = (device: DeviceConfig) => {
    if (device.provider === 'Garmin') {
      device.getAuthUrl();
    } else {
      window.location.href = device.getAuthUrl();
    }
  };

  const handleUnbind = async (accountId: number) => {
    if (!confirm('确定要解绑该设备吗？')) return;
    
    try {
      await request({
        url: `/api/v2/third-party-accounts/${accountId}/`,
        method: 'DELETE',
      });
      setAccounts(accounts.filter((acc) => acc.id !== accountId));
    } catch {
      alert('解绑失败');
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
                      绑定于 {new Date(account.created_at).toLocaleDateString()}
                    </Text>
                  </Group>
                  {account.synced_at && (
                    <Text size="xs" c="dimmed">
                      最后同步: {new Date(account.synced_at).toLocaleString()}
                    </Text>
                  )}
                  <Button
                    variant="light"
                    color="red"
                    size="sm"
                    mt="sm"
                    onClick={() => handleUnbind(account.id)}
                  >
                    解绑
                  </Button>
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
    </div>
  );
}
