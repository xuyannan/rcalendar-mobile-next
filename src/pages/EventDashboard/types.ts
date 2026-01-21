export interface TrackResult {
  id: number;
  trackedRunner: number;
  result: string;
  status: 'not_started' | 'racing' | 'finished';
  createdAt: string;
}

export interface TrackedRunner {
  id?: number;
  eventGroup: number;
  name?: string;
  nickname?: string;
  bibNumber?: string;
  trackingUrl?: string;
  latestResult?: TrackResult;
  status: 'not_started' | 'racing' | 'finished' | 'dns' | 'dnf';
  lastRefreshAt?: string;
  isAutoRefresh: boolean;
  canRefresh: boolean;
  nextRefreshIn: number;
}

export interface RunnerLocation {
  name: string;
  longitude: number;
  latitude: number;
  updatedAt?: string;
  runnerId?: number;
}

export interface CheckPoint {
  id: number;
  eventGroup: number;
  name: string;
  distance?: number;
  pointType: string;
  description?: string;
  closeTime?: string;
  sortOrder: number;
}

export interface RoutePoint {
  id?: number;
  eventGroup: number;
  name: string;
  pointType: 'aid_station' | 'checkpoint' | 'parking' | 'start' | 'finish' | 'other';
  longitude: number;
  latitude: number;
  elevation?: number;
  distance?: number;
  sortOrder?: number;
}

export interface EventGroup {
  id: number;
  name: string;
  distance?: number;
  distanceUnit?: string;
  description?: string;
  routeFile?: string;
  price?: number;
  quota?: number;
  routePoints?: RoutePoint[];
  trackedRunners?: TrackedRunner[];
  checkpoints?: CheckPoint[];
}

export interface EventData {
  id: string;
  name: string;
  enName?: string;
  date: string;
  country?: string;
  province?: string;
  city?: string;
  county?: string;
  address?: string;
  groups?: EventGroup[];
}

export const STATUS_MAP: Record<string, { text: string; color: string }> = {
  not_started: { text: '未开始', color: 'gray' },
  racing: { text: '比赛中', color: 'blue' },
  finished: { text: '已完赛', color: 'green' },
  dns: { text: 'DNS', color: 'orange' },
  dnf: { text: 'DNF', color: 'red' },
};
