import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, Button, Typography, message, Space, Spin, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { vendorsApi } from '../../api/vendors.api';

const { Title } = Typography;

export function VendorEditPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vendorCode, setVendorCode] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    vendorsApi
      .getById(id)
      .then((res) => {
        const v = res.data.data;
        setVendorCode(v.vendor_code);
        form.setFieldsValue({
          vendor_name: v.vendor_name,
          short_name: v.short_name,
          tax_id: v.tax_id,
          contact_person: v.contact_person,
          phone: v.phone,
          fax: v.fax,
          email: v.email,
          address: v.address,
          payment_terms: v.payment_terms,
          credit_limit: Number(v.credit_limit),
          notes: v.notes,
          status: v.status,
        });
      })
      .catch(() => message.error(t('vendors.loadFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: any) => {
    if (!id) return;
    setSaving(true);
    try {
      await vendorsApi.update(id, values);
      message.success(t('vendors.updateSuccess'));
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('vendors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;

  return (
    <div>
      <Title level={3}>{t('vendors.editVendor')} - {vendorCode}</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="vendor_name" label={t('vendors.vendorName')} rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="short_name" label={t('vendors.shortName')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tax_id" label={t('vendors.taxId')} rules={[{ pattern: /^\d{8}$/, message: '必須為 8 位數字' }]}>
                <Input maxLength={8} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contact_person" label={t('vendors.contactPerson')}>
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
            <Col span={8}>
              <Form.Item name="status" label={t('common.status')}>
                <Select options={[{ value: 'ACTIVE', label: t('common.active') }, { value: 'INACTIVE', label: t('common.inactive') }]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label={t('common.address')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="payment_terms" label={t('vendors.paymentTerms')}>
                <InputNumber min={0} max={365} addonAfter={t('vendors.paymentTermsDays')} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="credit_limit" label={t('vendors.creditLimit')}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v!.replace(/,/g, '') as any} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label={t('vendors.notes')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>{t('common.save')}</Button>
              <Button onClick={() => navigate('/vendors')}>{t('common.back')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
