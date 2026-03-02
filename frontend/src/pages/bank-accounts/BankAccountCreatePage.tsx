import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, Button, Typography, message, Space, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { bankAccountsApi } from '../../api/bank-accounts.api';

const { Title } = Typography;

export function BankAccountCreatePage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await bankAccountsApi.create(values);
      message.success(t('bankAccounts.createSuccess'));
      navigate('/bank-accounts');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('bankAccounts.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>{t('bankAccounts.createAccount')}</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form layout="vertical" onFinish={handleSubmit} initialValues={{ currency: 'TWD', opening_balance: 0 }}>
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
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item name="opening_balance" label={t('bankAccounts.openingBalance')}>
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v!.replace(/,/g, '') as any}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label={t('bankAccounts.notes')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>{t('common.create')}</Button>
              <Button onClick={() => navigate('/bank-accounts')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
