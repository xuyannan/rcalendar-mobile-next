import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import request from '../../utils/request';
import { STORAGE_USER_TOKEN } from '../../constants';
import { checkpoint, group, runner } from '../../test/trackingFixtures';
import PublicEventTracking from './index';

vi.mock('../../utils/request', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
const response = {
  event: { id: 12432, name: 'Test Event', timezone: 'Asia/Shanghai', date: '2026-11-13T00:00:00Z' },
  groups: [group(2, { name: 'Upcoming', startAt: '2099-01-01T00:00:00Z' }),
    group(1, { name: 'Ongoing', startAt: '2020-01-01T00:00:00Z', runners: [
      runner(1, { name: 'Alice', bibNumber: '5832', currentCheckpoint: checkpoint(3, { time: '08:00:00' }) }),
      runner(2, { name: 'Bob', currentCheckpoint: checkpoint(4, { time: '09:00:00' }) }),
    ] })],
  board: { id: 7, name: 'Test Board', eventId: 12432, eventName: 'Test Event', shareToken: 'fixture', isOwner: true, canAdd: true, runnerCount: 2 },
};

describe.each(['personal', 'shared'])('%s tracking page', (entry) => {
  it('shares defaults, group and runner ordering, local filtering, refresh persistence, and add UI', async () => {
    localStorage.setItem(STORAGE_USER_TOKEN, 'test-token');
    vi.mocked(request.get).mockImplementation(async (url: string) => (
      url.endsWith('/tracking-boards/') ? [] : response
    ));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const { unmount } = render(<MantineProvider env="test"><QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/events/12432/tracking${entry === 'shared' ? '?board=fixture' : ''}`]}>
        <Routes><Route path="/events/:id/tracking" element={<PublicEventTracking />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider></MantineProvider>);
    const region = await screen.findByRole('region', { name: 'Ongoing' });
    expect(screen.getByRole('radio', { name: '列表' })).toBeChecked();
    expect(screen.getAllByRole('region').map((element) => element.getAttribute('aria-label'))).toEqual(['Ongoing', 'Upcoming']);
    const bob = within(region).getAllByText('Bob')[0];
    const alice = within(region).getAllByText('Alice')[0];
    expect(bob.compareDocumentPosition(alice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const calls = vi.mocked(request.get).mock.calls.length;
    await userEvent.type(screen.getByRole('textbox', { name: '筛选Ongoing选手' }), '58');
    expect(within(region).queryByText('Bob')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '卡片' }));
    expect(within(region).getByText('查看历史检查点')).toBeVisible();
    expect(request.get).toHaveBeenCalledTimes(calls);
    expect(request.post).not.toHaveBeenCalled();
    const toggle = within(region).getByRole('button', { name: /Ongoing.*位选手/ });
    await userEvent.click(toggle);
    await userEvent.click(screen.getAllByRole('button', { name: '刷新' }).at(-1)!);
    await waitFor(() => expect(request.get).toHaveBeenCalledTimes(calls + 1));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('textbox', { name: '筛选Ongoing选手' })).toHaveValue('58');
    await userEvent.click(screen.getByRole('button', { name: '添加选手' }));
    expect(await screen.findByRole('dialog', { name: '添加选手' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /号码布或姓名/ })).toHaveValue('');
    unmount();
    client.clear();
  });
});
