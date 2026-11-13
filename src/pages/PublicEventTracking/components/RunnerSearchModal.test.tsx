import { MantineProvider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from '../../../utils/request';
import type { ResolutionCandidate } from '../types';
import RunnerSearchModal from './RunnerSearchModal';

vi.mock('../../../utils/request', () => ({ default: { post: vi.fn() } }));
vi.mock('@mantine/notifications', () => ({ notifications: { show: vi.fn() } }));
const candidate: ResolutionCandidate = {
  resolutionToken: 'fixture-token', bibNumber: '5832', name: 'Alice', status: 'racing',
  groupId: 1, groupName: '50 km', fromCache: true, preview: { checkpoints: [] },
};
const onClose = vi.fn();
const onConfirm = vi.fn<(_: ResolutionCandidate, nickname: string) => Promise<void>>();
const renderModal = (props = {}) => render(<MantineProvider env="test">
  <RunnerSearchModal opened eventId="12432" groupOptions={[{ value: '1', label: '50 km' }]}
    onClose={onClose} onConfirm={onConfirm} {...props} />
</MantineProvider>);

beforeEach(() => {
  vi.mocked(request.post).mockReset();
  onConfirm.mockReset().mockResolvedValue(undefined);
});

describe('add runner modal regression (mocked requests only)', () => {
  it('validates an empty query without sending a request', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: '查询选手' }));
    expect(screen.getByText('请输入号码布或姓名')).toBeVisible();
    expect(request.post).not.toHaveBeenCalled();
  });
  it('resolves with group selection, confirms a nickname, and closes after success', async () => {
    vi.mocked(request.post).mockResolvedValue({ candidates: [candidate] });
    renderModal();
    await userEvent.click(screen.getByRole('textbox', { name: '组别（可选）' }));
    await userEvent.click(screen.getByRole('option', { name: '50 km' }));
    await userEvent.type(screen.getByRole('textbox', { name: /号码布或姓名/ }), ' 5832 {Enter}');
    await screen.findByText('Alice');
    expect(request.post).toHaveBeenCalledWith('/api/v2/events/12432/public-tracking/resolve/',
      { bibNumber: '5832', eventGroupId: 1 }, { skipAuth: true });
    await userEvent.type(screen.getByRole('textbox', { name: '昵称（可选）' }), ' 小鹿 ');
    await userEvent.click(screen.getByRole('button', { name: '确认添加' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(candidate, '小鹿'));
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('requires selection among multiple candidates and supports going back', async () => {
    vi.mocked(request.post).mockResolvedValue({ candidates: [candidate, { ...candidate, name: 'Bob', resolutionToken: 'second' }] });
    renderModal({ showNickname: false, confirmLabel: '添加到共享列表' });
    await userEvent.type(screen.getByRole('textbox', { name: /号码布或姓名/ }), '58');
    await userEvent.click(screen.getByRole('button', { name: '查询选手' }));
    await userEvent.click(await screen.findByRole('button', { name: /50 km.*Alice/ }));
    expect(screen.queryByRole('textbox', { name: '昵称（可选）' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '返回选择' }));
    await userEvent.click(screen.getByRole('button', { name: /50 km.*Bob/ }));
    await userEvent.click(screen.getByRole('button', { name: '添加到共享列表' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bob' }), ''));
  });
  it('shows empty results and handles lookup failure without confirming', async () => {
    vi.mocked(request.post).mockResolvedValueOnce({ candidates: [] }).mockRejectedValueOnce({ response: { data: { detail: '查询失败' } } });
    renderModal();
    await userEvent.type(screen.getByRole('textbox', { name: /号码布或姓名/ }), '58');
    await userEvent.click(screen.getByRole('button', { name: '查询选手' }));
    expect(await screen.findByText('未找到该选手')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '查询选手' }));
    expect(await screen.findByText('查询失败')).toBeVisible();
    expect(onConfirm).not.toHaveBeenCalled();
  });
  it('keeps the modal open when confirm fails', async () => {
    vi.mocked(request.post).mockResolvedValue({ candidates: [candidate] });
    onConfirm.mockRejectedValue(new Error('failed'));
    renderModal();
    await userEvent.type(screen.getByRole('textbox', { name: /号码布或姓名/ }), '58{Enter}');
    await userEvent.click(await screen.findByRole('button', { name: '确认添加' }));
    await waitFor(() => expect(notifications.show).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });
  it('clears query and selection when reopened', async () => {
    const { rerender } = renderModal();
    await userEvent.type(screen.getByRole('textbox', { name: /号码布或姓名/ }), '58');
    const content = (opened: boolean) => <MantineProvider env="test"><RunnerSearchModal opened={opened} eventId="12432" groupOptions={[]} onClose={onClose} onConfirm={onConfirm} /></MantineProvider>;
    rerender(content(false));
    rerender(content(true));
    expect(screen.getByRole('textbox', { name: /号码布或姓名/ })).toHaveValue('');
  });
});
