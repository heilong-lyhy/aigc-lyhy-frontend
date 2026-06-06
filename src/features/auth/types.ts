import type {
  AccountStatus,
  AudienceTypeEnum,
  Gender,
  IdentityTypeEnum,
  LoginTypeEnum,
  RegisterTypeEnum,
  UserState,
} from '@/shared/graphql';

export type { AccountStatus, AudienceTypeEnum as AudienceType, Gender, IdentityTypeEnum as IdentityType, LoginTypeEnum as LoginType, RegisterTypeEnum as RegisterType, UserState };

export interface BasicUserInfo {
  readonly accountId: number;
  readonly avatarUrl: string | null;
  readonly gender: Gender;
  readonly id: string;
  readonly nickname: string;
  readonly phone: string | null;
}

export interface FullUserInfo extends BasicUserInfo {
  readonly accessGroup: readonly IdentityType[];
  readonly address: string | null;
  readonly birthDate: string | null;
  readonly createdAt: string;
  readonly email: string | null;
  readonly geographic: string | null;
  readonly notifyCount: number;
  readonly signature: string | null;
  readonly tags: readonly string[] | null;
  readonly unreadCount: number;
  readonly updatedAt: string;
  readonly userState: UserState;
}

export interface LoginResult {
  readonly accessToken: string;
  readonly accountId: number;
  readonly refreshToken: string;
  readonly role: IdentityType;
  readonly userInfo?: BasicUserInfo | null;
}

export interface RegisterResult {
  readonly accountId?: number | null;
  readonly message: string;
  readonly success: boolean;
}

export interface ResetPasswordResult {
  readonly accountId?: number | null;
  readonly message?: string | null;
  readonly success: boolean;
}

export interface ChangePasswordResult {
  readonly success: boolean;
  readonly message: string | null;
}

export interface AuthCredentials {
  readonly loginName: string;
  readonly loginPassword: string;
  readonly audience: AudienceType;
  readonly type: LoginType;
  readonly ip?: string;
}

export interface RegisterInput {
  readonly loginEmail: string;
  readonly loginName?: string;
  readonly loginPassword: string;
  readonly nickname?: string;
  readonly inviteToken?: string;
  readonly type?: RegisterType;
}
