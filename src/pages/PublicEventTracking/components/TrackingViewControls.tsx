import { SegmentedControl } from '@mantine/core';
export type TrackingViewMode = 'cards' | 'list';

interface TrackingViewModeToggleProps {
  value: TrackingViewMode;
  onChange: (value: TrackingViewMode) => void;
}

const TrackingViewModeToggle = ({
  value,
  onChange,
}: TrackingViewModeToggleProps) => (
  <SegmentedControl
    size="sm"
    value={value}
    onChange={(nextValue) => {
      if (nextValue === 'cards' || nextValue === 'list') {
        onChange(nextValue);
      }
    }}
    data={[
      { label: '卡片', value: 'cards' },
      { label: '列表', value: 'list' },
    ]}
    aria-label="选手展示模式"
  />
);

export default TrackingViewModeToggle;
