import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth.api';

const { Title } = Typography;

export function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const handleSubmit = async (values: { currentPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      await authApi.changePassword(values);
      message.success(t('changePassword.success'));
      form.resetFields();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || t('changePassword.failed');
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>{t('changePassword.title')}</Title>
      <Card style={{ maxWidth: 500 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="currentPassword"
            label={t('changePassword.currentPassword')}
            rules={[{ required: true, message: t('changePassword.currentPasswordRequired') }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t('changePassword.newPassword')}
            rules={[
              { required: true, message: t('changePassword.newPasswordRequired') },
              { min: 8, message: t('changePassword.passwordMinLength') },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('changePassword.confirmPassword')}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('changePassword.confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error(t('changePassword.passwordMismatch')));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('changePassword.submit')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
