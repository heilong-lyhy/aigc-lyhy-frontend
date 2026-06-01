import { useEffect, useReducer } from 'react';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Avatar, Button, Card, Descriptions, Spin } from 'antd';

import type { FullUserInfo } from '@/features/auth';
import { fetchFullUserInfo, useAuth } from '@/features/auth';

import { isGraphQLIngressError } from '@/shared/graphql';
import { PageHeader } from '@/shared/ui/page-header';

type AccountState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'loaded'; data: FullUserInfo }
  | { kind: 'error'; message: string };

type AccountAction =
  | { kind: 'start-loading' }
  | { kind: 'load-success'; data: FullUserInfo }
  | { kind: 'load-failure'; message: string };

function accountReducer(_state: AccountState, action: AccountAction): AccountState {
  switch (action.kind) {
    case 'start-loading':
      return { kind: 'loading' };
    case 'load-success':
      return { kind: 'loaded', data: action.data };
    case 'load-failure':
      return { kind: 'error', message: action.message };
  }
}

export default function AccountPage() {
  const { accountId, logout, userInfo, refreshUserInfo } = useAuth();
  const [accountState, dispatch] = useReducer(accountReducer, { kind: 'idle' });

  useEffect(() => {
    if (!accountId) {
      return;
    }

    let cancelled = false;
    dispatch({ kind: 'start-loading' });

    fetchFullUserInfo(accountId)
      .then((data) => {
        if (!cancelled) {
          dispatch({ kind: 'load-success', data });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = isGraphQLIngressError(err)
            ? err.userMessage
            : err instanceof Error
              ? err.message
              : '加载账户信息失败';
          dispatch({ kind: 'load-failure', message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  useEffect(() => {
    if (accountId && !userInfo) {
      refreshUserInfo();
    }
  }, [accountId, userInfo, refreshUserInfo]);

  if (!accountId) {
    return (
      <div className="page-stack">
        <PageHeader description="查看您的账户信息" title="账户" />
        <div className="surface-panel">
          <Card>
            <p>请先登录以查看账户信息</p>
          </Card>
        </div>
      </div>
    );
  }

  if (accountState.kind === 'loading') {
    return (
      <div className="page-stack">
        <PageHeader description="查看您的账户信息" title="账户" />
        <div className="surface-panel flex justify-center p-12">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (accountState.kind === 'error') {
    return (
      <div className="page-stack">
        <PageHeader description="查看您的账户信息" title="账户" />
        <div className="surface-panel">
          <Card>
            <Alert
              message={accountState.message}
              showIcon
              type="error"
            />
          </Card>
        </div>
      </div>
    );
  }

  const profile = accountState.data;

  return (
    <div className="page-stack">
      <PageHeader description="查看和管理您的账户信息" title="账户" />

      <div className="surface-panel">
        <Card
          actions={[
            <Button
              danger
              icon={<LogoutOutlined />}
              key="logout"
              onClick={logout}
              type="text"
            >
              退出登录
            </Button>,
          ]}
        >
          <div className="text-center mb-6">
            <Avatar
              icon={<UserOutlined />}
              size={80}
              src={profile.avatarUrl || userInfo?.avatarUrl}
            />
          </div>

          <Descriptions
            bordered
            column={1}
            size="small"
          >
            <Descriptions.Item label="用户ID">{profile.id}</Descriptions.Item>
            <Descriptions.Item label="昵称">{profile.nickname}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{profile.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="电话">{profile.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="性别">{profile.gender}</Descriptions.Item>
            <Descriptions.Item label="访问组">{profile.accessGroup.join(', ')}</Descriptions.Item>
            <Descriptions.Item label="用户状态">{profile.userState}</Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  );
}