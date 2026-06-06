// src/labs/blog-admin/ui/profile-settings.tsx

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Typography,
} from 'antd';

import type { BlogProfile, BlogSocialLink } from '@/entities/blog';

const { Title } = Typography;

// ── 类型 ──

type ProfileFormValues = {
  readonly nickname: string;
  readonly bio: string;
  readonly avatar: string;
};

type PasswordFormValues = {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
};

type SocialLinkInput = {
  readonly platform: string;
  readonly url: string;
  readonly icon: string | null;
};

type PasswordChangeResult = {
  readonly ok: boolean;
  readonly message?: string;
};

type ProfileSettingsProps = {
  readonly profile: BlogProfile | null;
  readonly isLoading: boolean;
  readonly mutationError: string | null;
  readonly onUpdateProfile: (
    input: Readonly<
      Partial<{
        nickname: string;
        avatar: string | null;
        bio: string;
        socialLinks: readonly BlogSocialLink[];
      }>
    >,
  ) => Promise<BlogProfile | null>;
  readonly onChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<PasswordChangeResult>;
};

// ── 组件 ──

export function ProfileSettings({
  profile,
  isLoading,
  mutationError,
  onUpdateProfile,
  onChangePassword,
}: ProfileSettingsProps) {
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();

  const [socialLinks, setSocialLinks] = useState<SocialLinkInput[]>([]);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 跟踪是否已初始化，避免重复填充
  const initializedProfileId = useRef<string | null>(null);

  // profile 到达后初始化表单（仅在 profile.id 变化时触发一次）
  useEffect(() => {
    if (profile && profile.id !== initializedProfileId.current) {
      initializedProfileId.current = profile.id;
      profileForm.setFieldsValue({
        nickname: profile.nickname,
        bio: profile.bio,
        avatar: profile.avatar ?? '',
      });
      setSocialLinks(
        profile.socialLinks.map((link) => ({
          platform: link.platform,
          url: link.url,
          icon: link.icon,
        })),
      );
    }
  }, [profile, profileForm]);

  const handleSaveProfile = useCallback(async () => {
    const values = await profileForm.validateFields();
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        nickname: values.nickname,
        bio: values.bio,
        avatar: values.avatar || null,
        socialLinks: socialLinks
          .filter((link) => link.platform && link.url)
          .map((link) => ({ platform: link.platform, url: link.url, icon: link.icon })),
      });
    } finally {
      setIsSavingProfile(false);
    }
  }, [profileForm, socialLinks, onUpdateProfile]);

  const handleChangePassword = useCallback(async () => {
    const values = await passwordForm.validateFields();
    if (values.newPassword !== values.confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }
    setPasswordError(null);
    setIsChangingPassword(true);
    try {
      const result = await onChangePassword(values.currentPassword, values.newPassword);
      if (!result.ok) {
        setPasswordError(result.message ?? '密码修改失败');
      } else {
        passwordForm.resetFields();
      }
    } finally {
      setIsChangingPassword(false);
    }
  }, [passwordForm, onChangePassword]);

  const handleAddSocialLink = useCallback(() => {
    setSocialLinks((prev) => [...prev, { platform: '', url: '', icon: null }]);
  }, []);

  const handleRemoveSocialLink = useCallback((index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSocialLinkChange = useCallback(
    (index: number, field: 'platform' | 'url', value: string) => {
      setSocialLinks((prev) =>
        prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
      );
    },
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <Title level={3} style={{ margin: 0 }}>
        个人设置
      </Title>

      {mutationError && <Alert message={mutationError} showIcon type="error" />}

      {/* 博主信息 */}
      <Card loading={isLoading} title="博主信息">
        <Form form={profileForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="昵称"
                name="nickname"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input placeholder="博主昵称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="头像 URL" name="avatar">
                <Input placeholder="https://example.com/avatar.jpg" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="简介" name="bio">
            <Input.TextArea placeholder="写一段简介..." rows={3} />
          </Form.Item>

          <Divider>社交链接</Divider>

          {socialLinks.map((link, index) => (
            <Row gutter={16} key={index}>
              <Col span={8}>
                <Form.Item label={index === 0 ? '平台' : ' '}>
                  <Input
                    placeholder="github / twitter / wechat"
                    value={link.platform}
                    onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={14}>
                <Form.Item label={index === 0 ? '链接' : ' '}>
                  <Input
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col flex="none">
                <Form.Item label={index === 0 ? ' ' : ' '}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveSocialLink(index)}
                  />
                </Form.Item>
              </Col>
            </Row>
          ))}

          <Button
            icon={<PlusOutlined />}
            onClick={handleAddSocialLink}
            style={{ width: '100%' }}
            variant="dashed"
          >
            添加社交链接
          </Button>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button
              loading={isSavingProfile}
              type="primary"
              onClick={handleSaveProfile}
            >
              保存信息
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 密码修改 */}
      <Card title="修改密码">
        {passwordError && (
          <Alert
            message={passwordError}
            showIcon
            style={{ marginBottom: 16 }}
            type="error"
          />
        )}
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="当前密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少 8 个字符' },
            ]}
          >
            <Input.Password placeholder="新密码" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            rules={[{ required: true, message: '请确认新密码' }]}
          >
            <Input.Password placeholder="确认新密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                loading={isChangingPassword}
                type="primary"
                onClick={handleChangePassword}
              >
                修改密码
              </Button>
              <Button onClick={() => passwordForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
