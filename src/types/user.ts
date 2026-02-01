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
  third_party_user_id: string | null;
  avatar: string | null;
  synced_at: string | null;
  created_at: string;
  backfill_completed: boolean;
}
