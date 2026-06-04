import { useEffect } from 'react';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Avatar, Button, Card, Descriptions, Spin } from 'antd';

import { useAuth, useFullUserInfo } from '@/features/auth';

import { PageHeader } from '@/shared/ui/page-header';

export default function AccountPage() {
  const { accountId, logout, userInfo, refreshUserInfo } = useAuth();

  const { data: profile, isLoading, error } = useFullUserInfo(accountId);

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

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader description="查看您的账户信息" title="账户" />
        <div className="surface-panel flex justify-center p-12">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-stack">
        <PageHeader description="查看您的账户信息" title="账户" />
        <div className="surface-panel">
          <Card>
            <Alert
              message={error ?? '加载账户信息失败'}
              showIcon
              type="error"
            />
          </Card>
        </div>
      </div>
    );
  }

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
