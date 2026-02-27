import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, Button, Typography, message, Space, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { companiesApi } from '../../api/companies.api';
import { useAuthStore } from '../../stores/authStore';

const { Title } = Typography;

export function CompanyCreatePage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { companies } = useAuthStore();
  const setCompanyData = useAuthStore((s) => s.setCompanyData);
  const { t } = useTranslation();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const res = await companiesApi.create(values);
      message.success(t('companies.createSuccess'));

      // Refresh companies list in store
      const listRes = await companiesApi.list();
      useAuthStore.setState({ companies: listRes.data.data });

      navigate('/companies');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('companies.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>{t('companies.createCompany')}</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form layout="vertical" onFinish={handleSubmit} initialValues={{ default_currency: 'TWD', tax_rate: 5, fiscal_year_start: 1 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="company_name" label={t('companies.companyName')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="short_name" label={t('companies.shortName')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tax_id" label={t('companies.taxId')} rules={[{ pattern: /^\d{8}$/, message: t('companies.taxIdInvalid') }]}>
                <Input maxLength={8} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="representative" label={t('companies.representative')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="phone" label={t('common.phone')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label={t('common.address')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="email" label={t('common.email')} rules={[{ type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fax" label={t('common.fax')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="default_currency" label={t('companies.defaultCurrency')}>
                <Select options={[{ value: 'TWD', label: 'TWD' }, { value: 'USD', label: 'USD' }, { value: 'HKD', label: 'HKD' }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax_rate" label={t('companies.taxRate')}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fiscal_year_start" label={t('companies.fiscalYearStart')}>
                <Select options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>{t('common.create')}</Button>
              <Button onClick={() => navigate('/companies')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
