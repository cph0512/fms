import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Button, Select, Typography, message, Space, Spin, Divider } from 'antd';
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
      .catch(() => message.error('Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (values: any) => {
    if (!id) return;
    setSaving(true);
    try {
      await usersApi.update(id, values);
      message.success('User updated successfully');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Failed to update');
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
      message.success('Roles updated successfully');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Failed to update roles');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;
  if (!user) return null;

  return (
    <div>
      <Title level={3}>Edit User: {user.display_name}</Title>

      <Card title="User Information" style={{ maxWidth: 600, marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label="Username"><Input value={user.username} disabled /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="display_name" label="Display Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} />
          </Form.Item>
          <Form.Item name="password" label="New Password (leave blank to keep current)">
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
              <Button onClick={() => navigate('/users')}>Back</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title={`Roles in ${currentCompany?.company_name}`} style={{ maxWidth: 600 }}>
        <Form form={rolesForm} layout="vertical" onFinish={handleRoles}>
          <Form.Item name="role_ids" label="Assigned Roles">
            <Select
              mode="multiple"
              placeholder="Select roles"
              options={roles.map((r) => ({ value: r.role_id, label: r.role_name }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>Update Roles</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
