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
  Checkbox,
  Stack,
  Box,
  LoadingOverlay,
} from '@mantine/core';
import { IconShoppingCart } from '@tabler/icons-react';
import request from '../../utils/request';
import type { StoreService } from '../../types/store';

const DEPOSIT_LABELS: Record<string, string> = {
  none: '免押金',
  cash: '押金',
  physical: '实物抵押',
};

export default function StoreIndex() {
  const navigate = useNavigate();
  const [services, setServices] = useState<StoreService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    request({ url: '/api/v2/store/services/', method: 'GET' })
      .then((res) => {
        setServices(res as unknown as StoreService[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleService = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const selectedServices = services.filter((s) => selected.has(s.id));

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDeposit = selectedServices.reduce((sum, s) => sum + s.depositAmount, 0);

  const handleCheckout = () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected).join(',');
    navigate(`/store/checkout?services=${ids}`);
  };

  if (loading) {
    return (
      <Container py="xl" style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible />
      </Container>
    );
  }

  if (services.length === 0) {
    return (
      <Container py="xl">
        <Text ta="center" c="dimmed">暂无可选服务</Text>
      </Container>
    );
  }

  return (
    <Box pb={100}>
      <Container py="md">
        <Title order={2} mb="md">选择服务</Title>

        <Stack gap="sm">
          {services.map((service) => (
            <Card
              key={service.id}
              shadow="sm"
              padding="md"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => toggleService(service.id)}
            >
              <Group justify="space-between" wrap="nowrap">
                <Checkbox
                  checked={selected.has(service.id)}
                  onChange={() => toggleService(service.id)}
                  label={
                    <Box>
                      <Text fw={500}>{service.name}</Text>
                      {service.description && (
                        <Text size="xs" c="dimmed" mt={2}>
                          {service.description}
                        </Text>
                      )}
                    </Box>
                  }
                />
                <Box style={{ textAlign: 'right', flexShrink: 0 }}>
                  <Text fw={600} c="red">
                    ¥{service.priceHuman}
                  </Text>
                  {service.depositAmount > 0 && (
                    <Badge size="xs" variant="light" color="orange" mt={4}>
                      {DEPOSIT_LABELS[service.depositType] || '押金'} ¥{service.depositHuman}
                    </Badge>
                  )}
                </Box>
              </Group>
            </Card>
          ))}
        </Stack>
      </Container>

      {/* Fixed bottom bar */}
      {selected.size > 0 && (
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
              <Text size="sm" c="dimmed">
                已选 {selected.size} 项
              </Text>
              <Text fw={700} c="red" size="lg">
                ¥{(totalPrice / 100).toFixed(2)}
                {totalDeposit > 0 && (
                  <Text component="span" size="xs" c="orange" ml={4}>
                    + ¥{(totalDeposit / 100).toFixed(2)} 押金
                  </Text>
                )}
              </Text>
            </Box>
            <Button
              size="md"
              leftSection={<IconShoppingCart size={18} />}
              onClick={handleCheckout}
            >
              去结算
            </Button>
          </Group>
        </Box>
      )}
    </Box>
  );
}
