import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      await login(values.username, values.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || t('auth.loginFailed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>{t('auth.title')}</Title>
          <Text type="secondary">{t('auth.subtitle')}</Text>
        </div>

        {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />}

        <Form layout="vertical" onFinish={handleSubmit} autoComplete="off" style={{ textAlign: 'left' }}>
          <Form.Item name="username" rules={[{ required: true, message: t('auth.usernameRequired') }]}>
            <Input prefix={<UserOutlined />} placeholder={t('auth.username')} size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t('auth.passwordRequired') }]}>
            <Input.Password prefix={<LockOutlined />} placeholder={t('auth.password')} size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              {t('auth.signIn')}
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}
