import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Button, Select, Typography, message, Space, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../stores/authStore';

const { Title } = Typography;

interface Role {
  role_id: number;
  role_name: string;
}

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [user, setUser] = useState<any>(null);
  const [form] = Form.useForm();
  const [rolesForm] = Form.useForm();
  const navigate = useNavigate();
  const currentCompany = useAuthStore((s) => s.currentCompany);
  const { t } = useTranslation();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([usersApi.getById(id), usersApi.getRoles()])
      .then(([userRes, rolesRes]) => {
        const userData = userRes.data.data;
        setUser(userData);
        setRoles(rolesRes.data.data);
        form.setFieldsValue({
          email: userData.email,
          display_name: userData.display_name,
          status: userData.status,
        });
        rolesForm.setFieldsValue({
          role_ids: userData.roles?.map((r: Role) => r.role_id) || [],
        });
      })
      .catch(() => message.error(t('users.loadFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (values: any) => {
    if (!id) return;
    setSaving(true);
    try {
      await usersApi.update(id, values);
      message.success(t('users.updateSuccess'));
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('users.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleRoles = async (values: any) => {
    if (!id || !currentCompany) return;
    setSaving(true);
    try {
      await usersApi.assignRoles(id, {
        company_id: currentCompany.company_id,
        role_ids: values.role_ids,
      });
      message.success(t('users.rolesUpdateSuccess'));
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('users.rolesUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;
  if (!user) return null;

  return (
    <div>
      <Title level={3}>{t('users.editUser', { name: user.display_name })}</Title>

      <Card title={t('users.userInfo')} style={{ maxWidth: 600, marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label={t('users.username')}><Input value={user.username} disabled /></Form.Item>
          <Form.Item name="email" label={t('users.email')} rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="display_name" label={t('users.displayName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label={t('common.status')}>
            <Select options={[{ value: 'ACTIVE', label: t('common.active') }, { value: 'INACTIVE', label: t('common.inactive') }]} />
          </Form.Item>
          <Form.Item name="password" label={t('users.newPassword')}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>{t('common.save')}</Button>
              <Button onClick={() => navigate('/users')}>{t('common.back')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title={t('users.rolesIn', { company: currentCompany?.company_name })} style={{ maxWidth: 600 }}>
        <Form form={rolesForm} layout="vertical" onFinish={handleRoles}>
          <Form.Item name="role_ids" label={t('users.assignedRoles')}>
            <Select
              mode="multiple"
              placeholder={t('users.selectRoles')}
              options={roles.map((r) => ({ value: r.role_id, label: r.role_name }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>{t('users.updateRoles')}</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
