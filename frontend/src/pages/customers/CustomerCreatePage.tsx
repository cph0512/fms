import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Button, Typography, message, Space, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { customersApi } from '../../api/customers.api';

const { Title } = Typography;

export function CustomerCreatePage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await customersApi.create(values);
      message.success(t('customers.createSuccess'));
      navigate('/customers');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('customers.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>{t('customers.createCustomer')}</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form layout="vertical" onFinish={handleSubmit} initialValues={{ payment_terms: 30, credit_limit: 0 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="customer_name" label={t('customers.customerName')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="short_name" label={t('customers.shortName')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tax_id" label={t('customers.taxId')} rules={[{ pattern: /^\d{8}$/, message: '必須為 8 位數字' }]}>
                <Input maxLength={8} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contact_person" label={t('customers.contactPerson')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="phone" label={t('common.phone')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
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
          <Form.Item name="address" label={t('common.address')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="payment_terms" label={t('customers.paymentTerms')}>
                <InputNumber min={0} max={365} addonAfter={t('customers.paymentTermsDays')} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="credit_limit" label={t('customers.creditLimit')}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v!.replace(/,/g, '') as any} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label={t('customers.notes')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>{t('common.create')}</Button>
              <Button onClick={() => navigate('/customers')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
