import React from 'react';
import { Title, Text, Group, Stack, Paper } from '@mantine/core';
import { IconCalendar, IconMapPin } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { EventData } from '../types';

interface EventHeaderProps {
  event: EventData;
}

const EventHeader: React.FC<EventHeaderProps> = ({ event }) => {
  const location = [event.country, event.province, event.city, event.county, event.address]
    .filter(Boolean)
    .join(' ');

  return (
    <Paper p="md" mb="md">
      <Stack gap="xs">
        <Title order={3}>{event.name}</Title>
        {event.enName && <Text c="dimmed" size="sm">{event.enName}</Text>}
        
        <Group gap="lg" mt="xs">
          <Group gap="xs">
            <IconCalendar size={16} color="gray" />
            <Text size="sm">
              {event.date ? dayjs(event.date).format('YYYY-MM-DD HH:mm') : '-'}
            </Text>
          </Group>
          {location && (
            <Group gap="xs">
              <IconMapPin size={16} color="gray" />
              <Text size="sm">{location}</Text>
            </Group>
          )}
        </Group>
      </Stack>
    </Paper>
  );
};

export default EventHeader;
