import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Button,
  Stack,
  Box,
  Divider,
  LoadingOverlay,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import request from '../../utils/request';
import type { StoreService, StoreOrder } from '../../types/store';

const DEPOSIT_LABELS: Record<string, string> = {
  none: '免押金',
  cash: '押金',
  physical: '实物抵押',
};

declare global {
  interface Window {
    wx?: {
      miniProgram: {
        navigateTo: (options: { url: string; success?: () => void; fail?: (err: unknown) => void }) => void;
        navigateBack: (options?: { delta?: number }) => void;
        postMessage: (options: { data: unknown }) => void;
      };
    };
  }
}

export default function StoreCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<StoreService[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const serviceIds = searchParams.get('services')?.split(',').map(Number).filter(Boolean) || [];

  useEffect(() => {
    if (serviceIds.length === 0) {
      navigate('/store', { replace: true });
      return;
    }

    request({ url: '/api/v2/store/services/', method: 'GET' })
      .then((res) => {
        const all = res as unknown as StoreService[];
        setServices(all.filter((s: StoreService) => serviceIds.includes(s.id)) as unknown as StoreService[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDeposit = services.reduce((sum, s) => sum + s.depositAmount, 0);

  const getDiscount = (count: number) => {
    if (count >= 3) return 0.8;
    if (count >= 2) return 0.9;
    return 1;
  };

  const discountRate = getDiscount(services.length);
  const finalPrice = Math.floor(totalPrice * discountRate);
  const payAmount = finalPrice + totalDeposit;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const order = await request({
        url: '/api/v2/store/orders/',
        method: 'POST',
        data: { serviceIds },
      }) as unknown as StoreOrder;

      setOrderId(order.id);

      if (window.wx?.miniProgram) {
        window.wx.miniProgram.navigateTo({
          url: `/pages/store/pay?id=${order.id}`,
          fail: () => {
            setSubmitting(false);
            alert('拉起支付失败，请重试');
          },
        });
      } else {
        // 非小程序环境：展示提示
        setSubmitting(false);
        alert('请在微信小程序中打开');
      }
    } catch (err: any) {
      setSubmitting(false);
      alert(err?.response?.data?.detail || err?.message || '创建订单失败，请重试');
    }
  };

  if (loading) {
    return (
      <Container py="xl" style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible />
      </Container>
    );
  }

  return (
    <Box pb={100}>
      <Container py="md">
        <Group mb="lg" gap="xs">
          <Button
            variant="subtle"
            size="sm"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
          <Title order={2}>确认订单</Title>
        </Group>

        <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
          <Text fw={500} mb="sm">服务明细</Text>
          <Stack gap="xs">
            {services.map((s) => (
              <Group key={s.id} justify="space-between">
                <Text size="sm">{s.name}</Text>
                <Text size="sm">¥{s.priceHuman}</Text>
              </Group>
            ))}
          </Stack>

          {discountRate < 1 && (
            <>
              <Divider my="sm" />
              <Group justify="space-between">
                <Text size="sm" c="green">
                  {services.length >= 3 ? '满3件8折' : '满2件9折'}
                </Text>
                <Text size="sm" c="green">
                  -¥{((totalPrice - finalPrice) / 100).toFixed(2)}
                </Text>
              </Group>
            </>
          )}

          <Divider my="sm" />

          <Group justify="space-between">
            <Text size="sm">服务费小计</Text>
            <Text fw={600}>¥{(finalPrice / 100).toFixed(2)}</Text>
          </Group>

          {totalDeposit > 0 && (
            <Group justify="space-between">
              <Text size="sm" c="orange">押金</Text>
              <Text size="sm" c="orange">¥{(totalDeposit / 100).toFixed(2)}</Text>
            </Group>
          )}

          <Divider my="sm" />

          <Group justify="space-between">
            <Text fw={700} size="lg">应付总额</Text>
            <Text fw={700} size="lg" c="red">
              ¥{(payAmount / 100).toFixed(2)}
            </Text>
          </Group>
        </Card>

        {services.some((s) => s.depositAmount > 0) && (
          <Card shadow="sm" padding="md" radius="md" withBorder mb="md">
            <Text size="xs" c="dimmed">
              押金说明：
              {services
                .filter((s) => s.depositAmount > 0)
                .map((s) => (
                  <Text key={s.id} component="span" display="block">
                    {s.name}：{DEPOSIT_LABELS[s.depositType] || '押金'} ¥{s.depositHuman}
                  </Text>
                ))}
              押金将在退还实物后原路退回。
            </Text>
          </Card>
        )}
      </Container>

      {/* Fixed bottom bar */}
      <Box
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #eee',
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          zIndex: 100,
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Box>
            <Text size="xs" c="dimmed">
              {services.length} 件服务
              {discountRate < 1 && ` · ${(discountRate * 10).toFixed(0)}折`}
            </Text>
            <Text fw={700} c="red" size="lg">
              ¥{(payAmount / 100).toFixed(2)}
            </Text>
          </Box>
          <Button
            size="md"
            loading={submitting}
            onClick={handleSubmit}
          >
            {orderId ? '支付中...' : '确认支付'}
          </Button>
        </Group>
      </Box>
    </Box>
  );
}
