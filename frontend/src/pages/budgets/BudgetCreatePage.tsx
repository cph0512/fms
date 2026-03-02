import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Button, Typography, message, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { budgetsApi } from '../../api/budgets.api';

const { Title } = Typography;

export function BudgetCreatePage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const res = await budgetsApi.create({
        fiscal_year: values.fiscal_year,
        name: values.name,
        description: values.description,
      });
      message.success(t('budgets.createSuccess'));
      navigate(`/budgets/${res.data.data.budget_id}`);
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('budgets.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>{t('budgets.createBudget')}</Title>
      <Card style={{ maxWidth: 600 }}>
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            fiscal_year: new Date().getFullYear(),
          }}
        >
          <Form.Item
            name="fiscal_year"
            label={t('budgets.fiscalYear')}
            rules={[{ required: true, message: t('budgets.fiscalYearRequired') }]}
          >
            <InputNumber min={2000} max={2100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="name"
            label={t('budgets.name')}
            rules={[{ required: true, message: t('budgets.nameRequired') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('budgets.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>{t('common.create')}</Button>
              <Button onClick={() => navigate('/budgets')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
