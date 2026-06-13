import { useState } from 'react';
import { UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Tabs } from 'antd';
import { useNavigate } from 'react-router';

import type { AudienceType } from '@/features/auth';
import { useAuth } from '@/features/auth';

import { PageHeader } from '@/shared/ui';

type LoginFormValues = {
  loginName: string;
  loginPassword: string;
  audience: AudienceType;
};

type AuthPageProps = {
  readonly defaultTab?: string;
};

function LoginTab({ registrationSuccess }: { readonly registrationSuccess?: boolean }) {
  const [form] = Form.useForm<LoginFormValues>();
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);

    try {
      await login({
        loginName: values.loginName,
        loginPassword: values.loginPassword,
        audience: values.audience || 'DESKTOP',
        type: 'PASSWORD',
      });

      navigate('/');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '登录时发生未知错误');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      size="large"
    >
      {registrationSuccess && (
        <div className="mb-6">
          <Alert
            message="注册成功，请登录"
            showIcon
            type="success"
          />
        </div>
      )}

      {errorMessage && (
        <div className="mb-6">
          <Alert
            message={errorMessage}
            showIcon
            type="error"
          />
        </div>
      )}

      <Form.Item
        label="用户名或邮箱"
        name="loginName"
        rules={[{ required: true, message: '请输入用户名或邮箱' }]}
      >
        <Input
          placeholder="请输入用户名或邮箱"
          prefix={<UserOutlined />}
        />
      </Form.Item>

      <Form.Item
        label="密码"
        name="loginPassword"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password placeholder="请输入密码" />
      </Form.Item>

      <Form.Item hidden name="audience" initialValue="DESKTOP">
        <Input />
      </Form.Item>

      <Form.Item>
        <Button
          htmlType="submit"
          loading={isLoading}
          type="primary"
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  );
}

function RegisterTab({ onRegisterSuccess }: { readonly onRegisterSuccess: () => void }) {
  const [form] = Form.useForm();
  const { register, isLoading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: { email: string; password: string; nickname: string }) => {
    setErrorMessage(null);

    try {
      const result = await register({
        loginEmail: values.email,
        loginName: values.nickname,
        loginPassword: values.password,
        nickname: values.nickname,
        type: 'REGISTRANT',
      });

      if (result.success) {
        onRegisterSuccess();
      } else {
        setErrorMessage(result.message || '注册失败');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '注册时发生未知错误');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      size="large"
    >
      {errorMessage && (
        <div className="mb-6">
          <Alert
            message={errorMessage}
            showIcon
            type="error"
          />
        </div>
      )}

      <Form.Item
        label="昵称"
        name="nickname"
        rules={[{ required: true, message: '请输入昵称' }]}
      >
        <Input placeholder="请输入昵称" />
      </Form.Item>

      <Form.Item
        label="邮箱"
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input placeholder="请输入邮箱" />
      </Form.Item>

      <Form.Item
        label="密码"
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6个字符' },
        ]}
      >
        <Input.Password placeholder="请输入密码" />
      </Form.Item>

      <Form.Item>
        <Button
          htmlType="submit"
          loading={isLoading}
          type="primary"
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  );
}

export default function AuthPage({ defaultTab = 'login' }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleRegisterSuccess = () => {
    setRegistrationSuccess(true);
    setActiveTab('login');
  };

  return (
    <div className="page-stack">
      <PageHeader
        description="登录或注册以继续使用"
        title="Login"
      />

      <div className="surface-panel">
        <Card>
          <Tabs
            activeKey={activeTab}
            items={[
              {
                key: 'login',
                label: '登录',
                children: <LoginTab registrationSuccess={registrationSuccess} />,
              },
              {
                key: 'register',
                label: '注册',
                children: <RegisterTab onRegisterSuccess={handleRegisterSuccess} />,
              },
            ]}
            onChange={setActiveTab}
          />
        </Card>
      </div>
    </div>
  );
}