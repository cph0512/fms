import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, DatePicker, Button, Typography, message, Space, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { apApi } from '../../api/ap.api';
import { vendorsApi } from '../../api/vendors.api';
import dayjs from 'dayjs';

const { Title } = Typography;

interface VendorOption {
  vendor_id: string;
  vendor_code: string;
  vendor_name: string;
}

export function ApBillCreatePage() {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    vendorsApi
      .list({ limit: 200, status: 'ACTIVE' })
      .then((res) => setVendors(res.data.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await apApi.createBill({
        vendor_id: values.vendor_id,
        bill_date: values.bill_date.format('YYYY-MM-DD'),
        due_date: values.due_date.format('YYYY-MM-DD'),
        subtotal: values.subtotal,
        description: values.description,
        notes: values.notes,
      });
      message.success(t('ap.createSuccess'));
      navigate('/ap/bills');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('ap.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>{t('ap.createBill')}</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            bill_date: dayjs(),
            due_date: dayjs().add(30, 'day'),
          }}
        >
          <Form.Item name="vendor_id" label={t('ap.vendor')} rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder={t('ap.selectVendor')}
              optionFilterProp="label"
              options={vendors.map((v) => ({
                value: v.vendor_id,
                label: `${v.vendor_code} - ${v.vendor_name}`,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bill_date" label={t('ap.billDate')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="due_date" label={t('ap.dueDate')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="subtotal" label={t('ap.subtotal')} rules={[{ required: true }]}>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => v!.replace(/,/g, '') as any}
            />
          </Form.Item>
          <Form.Item name="description" label={t('ap.description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notes" label={t('ap.notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>{t('common.create')}</Button>
              <Button onClick={() => navigate('/ap/bills')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
