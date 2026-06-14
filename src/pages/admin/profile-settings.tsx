// src/pages/admin/profile-settings.tsx

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

import type { BlogProfile } from '@/entities/blog';

const { Title } = Typography;

const LABEL_PAGE_TITLE = '个人设置';
const LABEL_PROFILE_INFO = '博主信息';
const LABEL_NICKNAME = '昵称';
const LABEL_NICKNAME_REQUIRED = '请输入昵称';
const LABEL_NICKNAME_PLACEHOLDER = '博主昵称';
const LABEL_AVATAR_URL = '头像 URL';
const LABEL_AVATAR_URL_PLACEHOLDER = 'https://example.com/avatar.jpg';
const LABEL_BIO = '简介';
const LABEL_BIO_PLACEHOLDER = '写一段简介...';
const LABEL_SOCIAL_LINKS = '社交链接';
const LABEL_PLATFORM = '平台';
const LABEL_PLATFORM_PLACEHOLDER = 'github / twitter / wechat';
const LABEL_LINK = '链接';
const LABEL_LINK_PLACEHOLDER = 'https://...';
const LABEL_ADD_SOCIAL_LINK = '添加社交链接';
const LABEL_SAVE = '保存信息';
const LABEL_CHANGE_PASSWORD = '修改密码';
const LABEL_CURRENT_PASSWORD = '当前密码';
const LABEL_CURRENT_PASSWORD_REQUIRED = '请输入当前密码';
const LABEL_NEW_PASSWORD = '新密码';
const LABEL_NEW_PASSWORD_REQUIRED = '请输入新密码';
const LABEL_PASSWORD_MIN_LENGTH = '密码至少 8 个字符';
const LABEL_CONFIRM_PASSWORD = '确认新密码';
const LABEL_CONFIRM_PASSWORD_REQUIRED = '请确认新密码';
const LABEL_SUBMIT_PASSWORD = '修改密码';
const LABEL_RESET = '重置';
const MSG_PASSWORD_MISMATCH = '两次输入的密码不一致';
const MSG_PASSWORD_CHANGE_FAILED = '密码修改失败';

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
        avatarUrl: string | null;
        bio: string;
        socialLinks: Record<string, string>;
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
        bio: profile.bio ?? '',
        avatar: profile.avatarUrl ?? '',
      });
      setSocialLinks(
        Object.entries(profile.socialLinks ?? {}).map(([platform, url]) => ({
          platform,
          url,
          icon: null,
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
        avatarUrl: values.avatar || null,
        socialLinks: Object.fromEntries(
          socialLinks
            .filter((link) => link.platform && link.url)
            .map((link) => [link.platform, link.url]),
        ),
      });
    } finally {
      setIsSavingProfile(false);
    }
  }, [profileForm, socialLinks, onUpdateProfile]);

  const handleChangePassword = useCallback(async () => {
    const values = await passwordForm.validateFields();
    if (values.newPassword !== values.confirmPassword) {
      setPasswordError(MSG_PASSWORD_MISMATCH);
      return;
    }
    setPasswordError(null);
    setIsChangingPassword(true);
    try {
      const result = await onChangePassword(values.currentPassword, values.newPassword);
      if (!result.ok) {
        setPasswordError(result.message ?? MSG_PASSWORD_CHANGE_FAILED);
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
      <div className="blog-typography-no-margin">
        <Title level={3}>
          {LABEL_PAGE_TITLE}
        </Title>
      </div>

      {mutationError && <Alert message={mutationError} showIcon type="error" />}

      {/* 博主信息 */}
      <Card loading={isLoading} title={LABEL_PROFILE_INFO}>
        <Form form={profileForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={LABEL_NICKNAME}
                name="nickname"
                rules={[{ required: true, message: LABEL_NICKNAME_REQUIRED }]}
              >
                <Input placeholder={LABEL_NICKNAME_PLACEHOLDER} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={LABEL_AVATAR_URL} name="avatar">
                <Input placeholder={LABEL_AVATAR_URL_PLACEHOLDER} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label={LABEL_BIO} name="bio">
            <Input.TextArea placeholder={LABEL_BIO_PLACEHOLDER} rows={3} />
          </Form.Item>

          <Divider>{LABEL_SOCIAL_LINKS}</Divider>

          {socialLinks.map((link, index) => (
            <Row gutter={16} key={index}>
              <Col span={8}>
                <Form.Item label={index === 0 ? LABEL_PLATFORM : ' '}>
                  <Input
                    placeholder={LABEL_PLATFORM_PLACEHOLDER}
                    value={link.platform}
                    onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={14}>
                <Form.Item label={index === 0 ? LABEL_LINK : ' '}>
                  <Input
                    placeholder={LABEL_LINK_PLACEHOLDER}
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

          <div className="w-full">
            <Button
              icon={<PlusOutlined />}
              onClick={handleAddSocialLink}
              variant="dashed"
            >
              {LABEL_ADD_SOCIAL_LINK}
            </Button>
          </div>

          <div className="mt-6">
            <div className="blog-typography-no-margin">
              <Form.Item>
                <Button
                  loading={isSavingProfile}
                  type="primary"
                  onClick={handleSaveProfile}
                >
                  {LABEL_SAVE}
                </Button>
              </Form.Item>
            </div>
          </div>
        </Form>
      </Card>

      {/* 密码修改 */}
      <Card title={LABEL_CHANGE_PASSWORD}>
        {passwordError && (
          <div className="mb-4">
            <Alert
              message={passwordError}
              showIcon
              type="error"
            />
          </div>
        )}
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            label={LABEL_CURRENT_PASSWORD}
            name="currentPassword"
            rules={[{ required: true, message: LABEL_CURRENT_PASSWORD_REQUIRED }]}
          >
            <Input.Password placeholder={LABEL_CURRENT_PASSWORD} />
          </Form.Item>
          <Form.Item
            label={LABEL_NEW_PASSWORD}
            name="newPassword"
            rules={[
              { required: true, message: LABEL_NEW_PASSWORD_REQUIRED },
              { min: 8, message: LABEL_PASSWORD_MIN_LENGTH },
            ]}
          >
            <Input.Password placeholder={LABEL_NEW_PASSWORD} />
          </Form.Item>
          <Form.Item
            label={LABEL_CONFIRM_PASSWORD}
            name="confirmPassword"
            rules={[{ required: true, message: LABEL_CONFIRM_PASSWORD_REQUIRED }]}
          >
            <Input.Password placeholder={LABEL_CONFIRM_PASSWORD} />
          </Form.Item>
          <div className="blog-typography-no-margin">
            <Form.Item>
              <Space>
                <Button
                  loading={isChangingPassword}
                  type="primary"
                  onClick={handleChangePassword}
                >
                  {LABEL_SUBMIT_PASSWORD}
                </Button>
                <Button onClick={() => passwordForm.resetFields()}>{LABEL_RESET}</Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>
    </div>
  );
}
