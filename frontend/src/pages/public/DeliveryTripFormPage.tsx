import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card, Form, Input, InputNumber, DatePicker, Button, Typography, message,
  Divider, Result, Row, Col,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, SendOutlined } from '@ant-design/icons';
import { publicFormApi } from '../../api/public.api';

const { Title, Text } = Typography;

export function DeliveryTripFormPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('c') || '';
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formatAmount = (val: number | string | undefined) =>
    val !== undefined ? Number(val).toLocaleString('zh-TW') : '0';

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await publicFormApi.submitDeliveryTrip({
        company_id: companyId,
        submitter_name: values.submitter_name,
        customer_name: values.customer_name,
        notes: values.notes,
        rows: values.rows.map((row: any) => ({
          row_date: row.row_date.format('YYYY-MM-DD'),
          route_content: row.route_content,
          description: row.description,
          trips_count: row.trips_count || 1,
          amount: row.amount || 0,
        })),
      });
      setSubmitted(true);
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || '提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  if (!companyId) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px' }}>
        <Result status="warning" title="無效的表單連結" subTitle="缺少公司參數，請確認連結是否正確。" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px' }}>
        <Result
          status="success"
          title="提交成功！"
          subTitle="您的請款資料已送出，管理員將會審核。"
          extra={[
            <Button key="another" type="primary" onClick={() => { setSubmitted(false); form.resetFields(); }}>
              再填一份
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>配送趟次請款單</Title>
          <Text type="secondary">請填寫以下請款資訊</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ rows: [{}] }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="submitter_name"
                label="提交者姓名"
                rules={[{ required: true, message: '請輸入姓名' }]}
              >
                <Input placeholder="您的姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="customer_name"
                label="客戶名稱"
                rules={[{ required: true, message: '請輸入客戶名稱' }]}
              >
                <Input placeholder="例：家福股份有限公司" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>請款明細</Divider>

          <Form.List name="rows">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 12, background: '#fafafa' }}
                    extra={
                      fields.length > 1 ? (
                        <MinusCircleOutlined
                          style={{ color: '#ff4d4f', cursor: 'pointer' }}
                          onClick={() => remove(name)}
                        />
                      ) : null
                    }
                  >
                    <Row gutter={12}>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'row_date']}
                          label="日期"
                          rules={[{ required: true, message: '選擇日期' }]}
                        >
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'route_content']}
                          label="請款內容"
                          rules={[{ required: true, message: '輸入內容' }]}
                        >
                          <Input placeholder="例：中原-明峰" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="內容"
                        >
                          <Input placeholder="例：熟食" />
                        </Form.Item>
                      </Col>
                      <Col xs={12} sm={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'trips_count']}
                          label="趟次"
                          initialValue={1}
                          rules={[{ required: true, message: '必填' }]}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={12} sm={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'amount']}
                          label="請款金額"
                          rules={[{ required: true, message: '必填' }]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(v) => v!.replace(/,/g, '') as any}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>
                    新增一列
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item shouldUpdate>
            {() => {
              const rows = form.getFieldValue('rows') || [];
              const total = rows.reduce((sum: number, r: any) => sum + (Number(r?.amount) || 0), 0);
              return (
                <div style={{ textAlign: 'right', marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    合計：${formatAmount(total)}
                  </Text>
                </div>
              );
            }}
          </Form.Item>

          <Form.Item name="notes" label="備註">
            <Input.TextArea rows={2} placeholder="其他需要說明的事項（選填）" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={submitting}
              size="large"
              block
            >
              提交請款單
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
