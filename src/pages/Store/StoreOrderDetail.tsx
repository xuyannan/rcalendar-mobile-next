import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Button,
  Stack,
  Box,
  Divider,
  LoadingOverlay,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import request from '../../utils/request';
import type { StoreOrder } from '../../types/store';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  created: { label: '待支付', color: 'yellow' },
  paid: { label: '已支付', color: 'blue' },
  finished: { label: '已完成', color: 'green' },
  canceled: { label: '已取消', color: 'gray' },
};

const DEPOSIT_LABELS: Record<string, string> = {
  none: '免押金',
  cash: '押金',
  physical: '实物抵押',
};

export default function StoreOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!id) return;
    request({ url: `/api/v2/store/${id}/orders/`, method: 'GET' })
      .then((res) => {
        setOrder(res as unknown as StoreOrder);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handlePay = () => {
    if (!order || !id) return;
    setPaying(true);

    if (window.wx?.miniProgram) {
      window.wx.miniProgram.navigateTo({
        url: `/pages/store/pay?id=${order.id}`,
        fail: () => {
          setPaying(false);
          alert('拉起支付失败，请重试');
        },
      });
    } else {
      setPaying(false);
      alert('请在微信小程序中打开');
    }
  };

  if (loading) {
    return (
      <Container py="xl" style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible />
      </Container>
    );
  }

  if (!order) {
    return (
      <Container py="xl">
        <Text ta="center" c="dimmed">订单不存在</Text>
        <Button mt="md" fullWidth onClick={() => navigate('/store')}>
          返回店铺
        </Button>
      </Container>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.created;

  return (
    <Container py="md" pb={100}>
      <Group mb="lg" gap="xs">
        <Button
          variant="subtle"
          size="sm"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/store/orders')}
        >
          返回
        </Button>
        <Title order={2}>订单详情</Title>
      </Group>

      {/* Status */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Group justify="space-between" mb="xs">
          <Text size="sm" c="dimmed">{order.orderNo}</Text>
          <Badge color={statusConfig.color} size="lg">
            {statusConfig.label}
          </Badge>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">操作员：{order.staffName}</Text>
          <Text size="sm" c="dimmed">
            {new Date(order.createdAt).toLocaleString()}
          </Text>
        </Group>
        {order.memberInfo && (
          <Text size="sm" c="dimmed" mt={4}>
            会员：{order.memberInfo.realName}（{order.memberInfo.memberNo}）
          </Text>
        )}
      </Card>

      {/* Items */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Text fw={500} mb="sm">服务明细</Text>
        <Stack gap="xs">
          {order.items.map((item) => (
            <Box key={item.id}>
              <Group justify="space-between">
                <Box>
                  <Text size="sm">{item.serviceName}</Text>
                  {item.depositAmount > 0 && (
                    <Text size="xs" c="orange">
                      {DEPOSIT_LABELS[item.depositType] || '押金'} ¥{item.depositAmountHuman}
                      {item.depositRefund && (
                        <Text component="span" c="green" ml={4}>
                          （已退还 ¥{item.depositRefund.refundAmountHuman}）
                        </Text>
                      )}
                      {!item.isDepositRefunded && item.depositAmount > 0 && item.depositType !== 'none' && (
                        <Text component="span" c="dimmed" ml={4}>
                          （待退还）
                        </Text>
                      )}
                    </Text>
                  )}
                </Box>
                <Text size="sm">¥{item.unitPriceHuman}</Text>
              </Group>
            </Box>
          ))}
        </Stack>

        <Divider my="sm" />

        {order.discountRate < 1 && (
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="green">折扣（{(order.discountRate * 10).toFixed(0)}折）</Text>
            <Text size="sm" c="green">
              -¥{(order.totalPriceHuman - order.finalPriceHuman).toFixed(2)}
            </Text>
          </Group>
        )}

        <Group justify="space-between" mb="xs">
          <Text size="sm">服务费</Text>
          <Text fw={600}>¥{order.finalPriceHuman.toFixed(2)}</Text>
        </Group>

        {order.totalDeposit > 0 && (
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="orange">押金</Text>
            <Text size="sm" c="orange">¥{order.totalDepositHuman.toFixed(2)}</Text>
          </Group>
        )}

        <Divider my="sm" />

        <Group justify="space-between">
          <Text fw={700}>实付金额</Text>
          <Text fw={700} c="red" size="lg">¥{order.payAmountHuman.toFixed(2)}</Text>
        </Group>
      </Card>

      {/* Note */}
      {order.note && (
        <Card shadow="sm" padding="md" radius="md" withBorder mb="md">
          <Text size="sm" c="dimmed">备注：{order.note}</Text>
        </Card>
      )}

      {/* Pay button */}
      {order.status === 'created' && (
        <Button
          fullWidth
          size="lg"
          loading={paying}
          onClick={handlePay}
          mb="md"
        >
          去支付 ¥{order.payAmountHuman.toFixed(2)}
        </Button>
      )}
    </Container>
  );
}
