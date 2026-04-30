import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Button,
  Stack,
  LoadingOverlay,
} from '@mantine/core';
import { IconArrowLeft, IconChevronRight } from '@tabler/icons-react';
import request from '../../utils/request';
import type { StoreOrderSimple } from '../../types/store';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  created: { label: '待支付', color: 'yellow' },
  paid: { label: '已支付', color: 'blue' },
  finished: { label: '已完成', color: 'green' },
  canceled: { label: '已取消', color: 'gray' },
};

export default function StoreOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<StoreOrderSimple[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request({ url: '/api/v2/store/orders/', method: 'GET' })
      .then((res) => {
        const data = res as { results?: StoreOrderSimple[] } | StoreOrderSimple[];
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data && 'results' in data && Array.isArray(data.results)) {
          setOrders(data.results);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container py="xl" style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible />
      </Container>
    );
  }

  return (
    <Container py="md">
      <Group mb="lg" gap="xs">
        <Button
          variant="subtle"
          size="sm"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/store')}
        >
          返回店铺
        </Button>
        <Title order={2}>我的订单</Title>
      </Group>

      {orders.length === 0 ? (
        <Text ta="center" c="dimmed" mt="xl">
          暂无订单
        </Text>
      ) : (
        <Stack gap="sm">
          {orders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.created;
            return (
              <Card
                key={order.id}
                shadow="sm"
                padding="md"
                radius="md"
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/store/orders/${order.id}`)}
              >
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">
                    {order.orderNo}
                  </Text>
                  <Badge color={statusConfig.color} variant="light" size="sm">
                    {statusConfig.label}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">
                    {order.itemCount} 件服务
                  </Text>
                  <Group gap="xs">
                    <Text fw={600} c="red">
                      ¥{order.payAmountHuman}
                    </Text>
                    <IconChevronRight size={14} color="gray" />
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
}
