import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, DatePicker, Button, Typography, message, Space, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { arApi } from '../../api/ar.api';
import { customersApi } from '../../api/customers.api';
import dayjs from 'dayjs';

const { Title } = Typography;

interface CustomerOption {
  customer_id: string;
  customer_code: string;
  customer_name: string;
}

export function ArInvoiceCreatePage() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    customersApi
      .list({ limit: 200, status: 'ACTIVE' })
      .then((res) => setCustomers(res.data.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await arApi.createInvoice({
        customer_id: values.customer_id,
        invoice_date: values.invoice_date.format('YYYY-MM-DD'),
        due_date: values.due_date.format('YYYY-MM-DD'),
        subtotal: values.subtotal,
        description: values.description,
        notes: values.notes,
      });
      message.success(t('ar.createSuccess'));
      navigate('/ar/invoices');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('ar.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>{t('ar.createInvoice')}</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            invoice_date: dayjs(),
            due_date: dayjs().add(30, 'day'),
          }}
        >
          <Form.Item name="customer_id" label={t('ar.customer')} rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder={t('ar.selectCustomer')}
              optionFilterProp="label"
              options={customers.map((c) => ({
                value: c.customer_id,
                label: `${c.customer_code} - ${c.customer_name}`,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="invoice_date" label={t('ar.invoiceDate')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="due_date" label={t('ar.dueDate')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="subtotal" label={t('ar.subtotal')} rules={[{ required: true }]}>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => v!.replace(/,/g, '') as any}
            />
          </Form.Item>
          <Form.Item name="description" label={t('ar.description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notes" label={t('ar.notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>{t('common.create')}</Button>
              <Button onClick={() => navigate('/ar/invoices')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
