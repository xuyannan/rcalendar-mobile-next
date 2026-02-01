export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  email: string;
  avatar_url: string;
  openid: string | null;
  unionid: string | null;
  has_password: boolean;
  real_name: string;
  phone: number | null;
  gender: number | null;
  birthday: string | null;
}

export interface ThirdPartyAccount {
  id: number;
  name: string;
  provider: 'Strava' | 'Garmin' | 'Coros';
  thirdPartyUserId: string | null;
  avatar: string | null;
  syncedAt: string | null;
  createdAt: string;
  backfillCompleted: boolean;
}
