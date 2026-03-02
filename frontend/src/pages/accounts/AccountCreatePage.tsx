import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Switch, Button, Typography, message, Space, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { accountsApi } from '../../api/accounts.api';

const { Title } = Typography;

const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

export function AccountCreatePage() {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    accountsApi.list({ limit: 200 }).then((res) => setAccounts(res.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await accountsApi.create(values);
      message.success(t('accounts.createSuccess'));
      navigate('/accounts');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('accounts.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>{t('accounts.createAccount')}</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form layout="vertical" onFinish={handleSubmit} initialValues={{ is_active: true }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="account_code" label={t('accounts.accountCode')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="account_name" label={t('accounts.accountName')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="account_type" label={t('accounts.accountType')} rules={[{ required: true }]}>
                <Select options={accountTypes.map((at) => ({ value: at, label: t(`accounts.type_${at}`) }))} />
              </Form.Item>
            </Col>
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
              <Button type="primary" htmlType="submit" loading={loading}>{t('common.create')}</Button>
              <Button onClick={() => navigate('/accounts')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
