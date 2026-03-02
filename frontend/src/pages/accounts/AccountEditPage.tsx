import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Select, Switch, Button, Typography, message, Space, Spin, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { accountsApi } from '../../api/accounts.api';

const { Title } = Typography;

const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

export function AccountEditPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountCode, setAccountCode] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      accountsApi.getById(id),
      accountsApi.list({ limit: 200 }),
    ]).then(([accRes, listRes]) => {
      const acc = accRes.data.data;
      setAccountCode(acc.account_code);
      setAccounts(listRes.data.data.filter((a: any) => a.account_id !== id));
      form.setFieldsValue({
        account_name: acc.account_name,
        account_type: acc.account_type,
        parent_account_id: acc.parent_account_id,
        description: acc.description,
        is_active: acc.is_active,
      });
    }).catch(() => message.error(t('accounts.loadFailed'))).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: any) => {
    if (!id) return;
    setSaving(true);
    try {
      await accountsApi.update(id, values);
      message.success(t('accounts.updateSuccess'));
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('accounts.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;

  return (
    <div>
      <Title level={3}>{t('accounts.editAccount')} - {accountCode}</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="account_name" label={t('accounts.accountName')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="account_type" label={t('accounts.accountType')} rules={[{ required: true }]}>
                <Select options={accountTypes.map((at) => ({ value: at, label: t(`accounts.type_${at}`) }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="parent_account_id" label={t('accounts.parentAccount')}>
                <Select allowClear showSearch optionFilterProp="label" options={accounts.map((a) => ({ value: a.account_id, label: `${a.account_code} ${a.account_name}` }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="is_active" label={t('common.status')} valuePropName="checked">
                <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label={t('accounts.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>{t('common.save')}</Button>
              <Button onClick={() => navigate('/accounts')}>{t('common.back')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
