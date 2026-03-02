import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, Switch, Button, Typography, message, Space, Spin, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { bankAccountsApi } from '../../api/bank-accounts.api';

const { Title } = Typography;

export function BankAccountEditPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    bankAccountsApi
      .getById(id)
      .then((res) => {
        const a = res.data.data;
        setAccountName(a.account_name);
        form.setFieldsValue({
          account_name: a.account_name,
          bank_name: a.bank_name,
          branch_name: a.branch_name,
          account_number: a.account_number,
          currency: a.currency,
          opening_balance: Number(a.opening_balance),
          current_balance: Number(a.current_balance),
          is_active: a.is_active,
          notes: a.notes,
        });
      })
      .catch(() => message.error(t('bankAccounts.loadFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: any) => {
    if (!id) return;
    setSaving(true);
    try {
      await bankAccountsApi.update(id, values);
      message.success(t('bankAccounts.updateSuccess'));
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('bankAccounts.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;

  return (
    <div>
      <Title level={3}>{t('bankAccounts.editAccount')} - {accountName}</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="account_name" label={t('bankAccounts.accountName')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bank_name" label={t('bankAccounts.bankName')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="branch_name" label={t('bankAccounts.branchName')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="account_number" label={t('bankAccounts.accountNumber')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="currency" label={t('bankAccounts.currency')}>
                <Select
                  options={[
                    { value: 'TWD', label: 'TWD' },
                    { value: 'USD', label: 'USD' },
                    { value: 'HKD', label: 'HKD' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="current_balance" label={t('bankAccounts.currentBalance')}>
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v!.replace(/,/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="is_active" label={t('bankAccounts.isActive')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label={t('bankAccounts.notes')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>{t('common.save')}</Button>
              <Button onClick={() => navigate('/bank-accounts')}>{t('common.back')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
