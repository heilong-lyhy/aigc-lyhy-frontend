export type IdentityType = 'ADMIN' | 'GUEST' | 'REGISTRANT' | 'STAFF';

export type Gender = 'FEMALE' | 'MALE' | 'SECRET';

export type AccountStatus = 'ACTIVE' | 'BANNED' | 'DELETED' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

export type AudienceType = 'DESKTOP' | 'SJWEAPP' | 'SJWEB' | 'SSTSTEST' | 'SSTSWEAPP' | 'SSTSWEB';

export type UserState = 'ACTIVE' | 'BANNED' | 'DELETED' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

export interface BasicUserInfo {
  accountId: number;
  avatarUrl: string | null;
  gender: Gender;
  id: number;
  nickname: string;
  phone: string | null;
}

export interface FullUserInfo extends BasicUserInfo {
  accessGroup: IdentityType[];
  address: string | null;
  birthDate: string | null;
  createdAt: string;
  email: string | null;
  geographic: string | null;
  notifyCount: number;
  signature: string | null;
  tags: string[] | null;
  unreadCount: number;
  updatedAt: string;
  userState: UserState;
}

export interface LoginResult {
  accessToken: string;
  accountId: number;
  refreshToken: string;
  role: IdentityType;
  userInfo?: BasicUserInfo;
}

export interface RegisterResult {
  accountId?: number;
  message: string;
  success: boolean;
}

export interface ResetPasswordResult {
  accountId?: number;
  message?: string;
  success: boolean;
}

export interface AuthCredentials {
  loginName: string;
  loginPassword: string;
  audience: AudienceType;
  type: 'PASSWORD' | 'SMS' | 'WECHAT';
  ip?: string;
}

export interface RegisterInput {
  loginEmail: string;
  loginName?: string;
  loginPassword: string;
  nickname?: string;
  inviteToken?: string;
  type: 'REGISTRANT' | 'STAFF';
}