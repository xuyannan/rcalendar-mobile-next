export type TrackingStatus =
  | 'not_started'
  | 'racing'
  | 'finished'
  | 'dns'
  | 'dnf';

export interface TrackingCheckpoint {
  id: number;
  name: string;
  providerPointId?: string | number | null;
  distance?: number | null;
  pointType: string;
  sortOrder: number;
  time?: string | null;
  timeBeijing?: string | null;
  prediction?: string | null;
  predictionBeijing?: string | null;
  cumulativeTime?: string | null;
  isPredicted?: boolean;
}

export interface OfficialRunnerProfile {
  avatarUrl?: string | null;
  utmbIndex?: number | null;
  ageGroup?: string | null;
  brand?: string | null;
}

export interface PublicTrackingRunner extends OfficialRunnerProfile {
  id: number;
  eventGroupId: number;
  bibNumber: string;
  name: string;
  nickname: string;
  status: TrackingStatus;
  currentCheckpoint: TrackingCheckpoint | null;
  nextCheckpoint: TrackingCheckpoint | null;
  history: TrackingCheckpoint[];
  location?: Record<string, unknown> | null;
  ranking?: Record<string, unknown> | null;
  lastRefreshAt?: string | null;
  lastRefreshAtLocal?: string | null;
  lastRefreshAtBeijing?: string | null;
}

export interface PublicTrackingGroup {
  id: number;
  name: string;
  distance?: number | null;
  distanceUnit?: string;
  startAt?: string | null;
  startAtLocal?: string | null;
  startAtBeijing?: string | null;
  closeAt?: string | null;
  closeAtLocal?: string | null;
  closeAtBeijing?: string | null;
  checkpoints: TrackingCheckpoint[];
  runners: PublicTrackingRunner[];
}

export interface PublicTrackingResponse {
  event: {
    id: number;
    name: string;
    enName?: string | null;
    date: string;
    dateLocal?: string | null;
    dateBeijing?: string | null;
    timezone: string;
    eventStatus: string;
    refreshInterval: number;
  };
  groups: PublicTrackingGroup[];
}

export interface ResolutionPreview {
  checkpoints: Array<{
    name: string;
    providerPointId?: string | number | null;
    time?: string | null;
    prediction?: string | null;
    cumulativeTime?: string | null;
  }>;
  ranking?: Record<string, unknown> | null;
}

export interface ResolutionCandidate extends OfficialRunnerProfile {
  resolutionToken: string;
  trackedRunnerId?: number | null;
  bibNumber: string;
  name: string;
  status: TrackingStatus;
  groupId: number;
  groupName: string;
  fromCache: boolean;
  preview: ResolutionPreview;
}

export interface ResolveResponse {
  candidates: ResolutionCandidate[];
}

export interface ConfirmResponse {
  runnerId: number;
  subscriptionId?: number | null;
  isAuthenticated: boolean;
}

export interface LocalTrackingEntry {
  runnerId: number;
  eventGroupId: number;
  bibNumber: string;
  nickname: string;
}

export interface SyncResponse {
  synced: number;
  created: number;
  syncedRunnerIds: number[];
  synced_runner_ids?: number[];
}

export type TrackingBoardAddPolicy = 'owner_only' | 'members';

export interface TrackingBoardSummary {
  id: number;
  name: string;
  eventId: number;
  eventName: string;
  shareToken: string;
  addPolicy: TrackingBoardAddPolicy;
  isActive: boolean;
  isDeleted?: boolean;
  runnerCount: number;
  isOwner: boolean;
  canAdd: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TrackingBoardListResponse = TrackingBoardSummary[];

export interface SharedTrackingResponse extends PublicTrackingResponse {
  board: TrackingBoardSummary;
}
