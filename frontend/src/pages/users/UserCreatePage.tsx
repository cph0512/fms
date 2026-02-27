import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Select, Typography, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../stores/authStore';

const { Title } = Typography;

interface Role {
  role_id: number;
  role_name: string;
  description: string;
}

export function UserCreatePage() {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const navigate = useNavigate();
  const currentCompany = useAuthStore((s) => s.currentCompany);
  const { t } = useTranslation();

  useEffect(() => {
    usersApi.getRoles().then((res) => setRoles(res.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await usersApi.create({
        ...values,
        company_id: currentCompany?.company_id,
      });
      message.success(t('users.createSuccess'));
      navigate('/users');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || t('users.createFailed');
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>{t('users.createUser')}</Title>
      <Card style={{ maxWidth: 600 }}>
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="username" label={t('users.username')} rules={[{ required: true }, { min: 3 }, { pattern: /^[a-zA-Z0-9_]+$/, message: t('users.usernamePattern') }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label={t('users.email')} rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label={t('users.password')} rules={[{ required: true }, { min: 8 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="display_name" label={t('users.displayName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role_ids" label={t('users.roles')}>
            <Select mode="multiple" placeholder={t('users.selectRoles')} options={roles.map((r) => ({ value: r.role_id, label: r.role_name }))} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>{t('common.create')}</Button>
              <Button onClick={() => navigate('/users')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
