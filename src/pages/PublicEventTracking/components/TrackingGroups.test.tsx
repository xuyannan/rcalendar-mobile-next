import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TrackingGroups from './TrackingGroups';
import TrackingViewModeToggle from './TrackingViewControls';
import useTrackingViewMode from './useTrackingViewMode';
import { checkpoint, group, runner } from '../../../test/trackingFixtures';
import type { PublicTrackingGroup } from '../types';

const first = group(1, { runners: [
  runner(1, { name: 'Alice', nickname: '小鹿', bibNumber: '5832', currentCheckpoint: checkpoint(3, { time: '08:00:00' }) }),
  runner(2, { name: 'Bob', currentCheckpoint: checkpoint(4, { time: '09:00:00' }) }),
] });
const second = group(2, { runners: [runner(3, { name: 'Charlie' })] });
const onRemove = vi.fn();
const Harness = ({ groups = [first, second, group(3)] }: { groups?: PublicTrackingGroup[] }) => {
  const [viewMode, setViewMode] = useTrackingViewMode();
  return <MantineProvider env="test">
    <TrackingViewModeToggle value={viewMode} onChange={setViewMode} />
    <TrackingGroups groups={groups} now={0} eventTimezone="UTC" viewMode={viewMode}
      storageKey="test-event" canRemove removingRunnerId={null} emptyMessage="暂无共享选手" onRemove={onRemove} />
  </MantineProvider>;
};
const section = (id: number) => within(screen.getByRole('region', { name: `Group ${id}` }));
const header = (id: number) => section(id).getByRole('button', { name: new RegExp(`Group ${id}.*位选手`) });

describe('tracking group interactions', () => {
  it('defaults populated groups open and empty groups closed; explicitly opening an empty group shows its original message', async () => {
    render(<Harness />);
    expect(header(1)).toHaveAttribute('aria-expanded', 'true');
    expect(header(3)).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(header(3));
    expect(section(3).getByText('暂无共享选手')).toBeVisible();
  });
  it('filters only its own group, shows no-match state, and restores progress order on clear', async () => {
    render(<Harness />);
    const search = screen.getByRole('textbox', { name: '筛选Group 1选手' });
    await userEvent.type(search, 'nothing');
    expect(section(1).getByText('未找到匹配选手')).toBeVisible();
    expect(section(2).getAllByText('Charlie').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: '清空Group 1筛选' }));
    const bob = section(1).getAllByText('Bob')[0];
    const alice = section(1).getAllByText('小鹿')[0];
    expect(bob.compareDocumentPosition(alice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it.each([' ALICE ', '小鹿', '58'])('matches %s in the actual list UI', (value) => {
    render(<Harness />);
    fireEvent.change(screen.getByRole('textbox', { name: '筛选Group 1选手' }), { target: { value } });
    expect(section(1).getAllByText('小鹿').length).toBeGreaterThan(0);
    expect(section(1).queryByText('Bob')).not.toBeInTheDocument();
  });
  it('keeps independent search terms and does not toggle groups on input, Enter, Space, or clear', async () => {
    render(<Harness />);
    await userEvent.click(header(1));
    const search = screen.getByRole('textbox', { name: '筛选Group 1选手' });
    await userEvent.type(search, '58 {Enter}');
    expect(header(1)).toHaveAttribute('aria-expanded', 'false');
    await userEvent.type(screen.getByRole('textbox', { name: '筛选Group 2选手' }), 'char');
    expect(search).toHaveValue('58 ');
    await userEvent.click(screen.getByRole('button', { name: '清空Group 1筛选' }));
    expect(header(1)).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('textbox', { name: '筛选Group 2选手' })).toHaveValue('char');
    await userEvent.click(header(1));
    expect(section(1).getAllByText('Bob').length).toBeGreaterThan(0);
  });
  it('preserves manual collapse and filtering across data refreshes and view switches', async () => {
    const { rerender, unmount } = render(<Harness />);
    await userEvent.type(screen.getByRole('textbox', { name: '筛选Group 2选手' }), 'char');
    await userEvent.click(header(1));
    await userEvent.click(screen.getByRole('radio', { name: '卡片' }));
    expect(header(1)).toHaveAttribute('aria-expanded', 'false');
    expect(section(1).queryByText('Bob')).not.toBeInTheDocument();
    rerender(<Harness groups={[{ ...first, runners: [...first.runners, runner(4)] }, second]} />);
    expect(header(1)).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('textbox', { name: '筛选Group 2选手' })).toHaveValue('char');
    unmount();
    render(<Harness />);
    expect(header(1)).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(header(1));
    expect(section(1).getAllByText('查看历史检查点')).toHaveLength(2);
    await userEvent.click(screen.getByRole('radio', { name: '列表' }));
    expect(header(1)).toHaveAttribute('aria-expanded', 'true');
  });
  it('uses the same progress order and filter in card and list modes', async () => {
    render(<Harness />);
    for (const mode of ['卡片', '列表']) {
      await userEvent.click(screen.getByRole('radio', { name: mode }));
      const bob = section(1).getAllByText('Bob')[0];
      const alice = section(1).getAllByText('小鹿')[0];
      expect(bob.compareDocumentPosition(alice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
  it('opens row history and keeps the remove button separate from expansion', async () => {
    render(<Harness groups={[group(1, { runners: [runner(1, { name: 'Alice', history: [checkpoint(3, { name: 'History point', time: '08:00:00' })] })] })]} />);
    const row = section(1).getByRole('button', { name: /Alice.*当前检查点/ });
    expect(row).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(section(1).getByRole('button', { name: '移除Alice' }));
    expect(onRemove).toHaveBeenCalledWith(1);
    expect(row).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(row);
    await waitFor(() => expect(section(1).getByText('History point')).toBeVisible());
  });
  it('falls back safely when saved collapse data is malformed', () => {
    localStorage.setItem('event-tracking-group-collapse:test-event', 'bad json');
    render(<Harness />);
    expect(header(1)).toHaveAttribute('aria-expanded', 'true');
  });
});
