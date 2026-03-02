import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, Button, Typography, message, Space, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { deliveryRoutesApi } from '../../api/delivery-routes.api';
import { customersApi } from '../../api/customers.api';

const { Title } = Typography;

interface CustomerOption {
  customer_id: string;
  customer_code: string;
  customer_name: string;
  address?: string;
}

export function RouteCreatePage() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    customersApi
      .list({ limit: 200, status: 'ACTIVE' })
      .then((res) => setCustomers(res.data.data))
      .catch(() => {});
  }, []);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.customer_id === customerId);
    if (customer?.address) {
      form.setFieldsValue({ origin: customer.address });
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await deliveryRoutesApi.create(values);
      message.success(t('delivery.createRouteSuccess'));
      navigate('/delivery-routes');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('delivery.createRouteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>{t('delivery.createRoute')}</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="customer_id" label={t('delivery.customer')} rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder={t('delivery.selectCustomer')}
              optionFilterProp="label"
              onChange={handleCustomerChange}
              options={customers.map((c) => ({
                value: c.customer_id,
                label: `${c.customer_code} - ${c.customer_name}`,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="origin" label={t('delivery.origin')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="route_name" label={t('delivery.routeName')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="content_type" label={t('delivery.contentType')} rules={[{ required: true }]}>
                <Select
                  placeholder={t('delivery.selectContentType')}
                  options={[
                    { value: '熟食', label: '熟食' },
                    { value: '麵包', label: '麵包' },
                    { value: '其他', label: '其他' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="standard_price" label={t('delivery.standardPrice')} rules={[{ required: true }]}>
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v!.replace(/,/g, '') as any}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label={t('delivery.notes')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>{t('common.create')}</Button>
              <Button onClick={() => navigate('/delivery-routes')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
