import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, Switch, Button, Typography, message, Space, Spin, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { deliveryRoutesApi } from '../../api/delivery-routes.api';
import { customersApi } from '../../api/customers.api';

const { Title } = Typography;

interface CustomerOption {
  customer_id: string;
  customer_code: string;
  customer_name: string;
}

export function RouteEditPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [routeName, setRouteName] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    customersApi
      .list({ limit: 200, status: 'ACTIVE' })
      .then((res) => setCustomers(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    deliveryRoutesApi
      .getById(id)
      .then((res) => {
        const r = res.data.data;
        setRouteName(r.route_name);
        form.setFieldsValue({
          customer_id: r.customer_id,
          origin: r.origin,
          route_name: r.route_name,
          content_type: r.content_type,
          standard_price: Number(r.standard_price),
          notes: r.notes,
          is_active: r.is_active,
        });
      })
      .catch(() => message.error(t('delivery.loadRoutesFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: any) => {
    if (!id) return;
    setSaving(true);
    try {
      await deliveryRoutesApi.update(id, values);
      message.success(t('delivery.updateRouteSuccess'));
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('delivery.updateRouteFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;

  return (
    <div>
      <Title level={3}>{t('delivery.editRoute')} - {routeName}</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="customer_id" label={t('delivery.customer')} rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder={t('delivery.selectCustomer')}
              optionFilterProp="label"
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
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item name="standard_price" label={t('delivery.standardPrice')} rules={[{ required: true }]}>
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v!.replace(/,/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="is_active" label={t('delivery.isActive')} valuePropName="checked">
                <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label={t('delivery.notes')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>{t('common.save')}</Button>
              <Button onClick={() => navigate('/delivery-routes')}>{t('common.back')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
