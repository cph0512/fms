import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, Button, Typography, message, Space, Spin, Row, Col } from 'antd';
import { companiesApi } from '../../api/companies.api';

const { Title } = Typography;

export function CompanyEditPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    companiesApi
      .getById(id)
      .then((res) => {
        const c = res.data.data;
        form.setFieldsValue({
          company_name: c.company_name,
          short_name: c.short_name,
          tax_id: c.tax_id,
          representative: c.representative,
          phone: c.phone,
          fax: c.fax,
          address: c.address,
          email: c.email,
          default_currency: c.default_currency,
          tax_rate: Number(c.tax_rate),
          fiscal_year_start: c.fiscal_year_start,
          status: c.status,
        });
      })
      .catch(() => message.error('Failed to load company'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: any) => {
    if (!id) return;
    setSaving(true);
    try {
      await companiesApi.update(id, values);
      message.success('Company updated successfully');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;

  return (
    <div>
      <Title level={3}>Edit Company</Title>
      <Card style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="company_name" label="Company Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="short_name" label="Short Name">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tax_id" label="Tax ID (UBN)" rules={[{ pattern: /^\d{8}$/, message: 'Must be 8 digits' }]}>
                <Input maxLength={8} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="representative" label="Representative">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fax" label="Fax">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Status">
                <Select options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="default_currency" label="Default Currency">
                <Select options={[{ value: 'TWD', label: 'TWD' }, { value: 'USD', label: 'USD' }, { value: 'HKD', label: 'HKD' }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax_rate" label="Tax Rate (%)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fiscal_year_start" label="Fiscal Year Start Month">
                <Select options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
              <Button onClick={() => navigate('/companies')}>Back</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
