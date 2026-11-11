import { useEffect, useState } from 'react';
import type { TrackingViewMode } from './TrackingViewControls';

const VIEW_MODE_STORAGE_KEY = 'event-tracking-view-mode';

const readViewMode = (): TrackingViewMode => {
  try {
    return localStorage.getItem(VIEW_MODE_STORAGE_KEY) === 'list'
      ? 'list'
      : 'cards';
  } catch {
    return 'cards';
  }
};

const useTrackingViewMode = () => {
  const [viewMode, setViewMode] = useState<TrackingViewMode>(readViewMode);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    } catch {
      // Ignore storage failures and keep the setting for this page session.
    }
  }, [viewMode]);

  return [viewMode, setViewMode] as const;
};

export default useTrackingViewMode;
