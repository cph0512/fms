import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Table, Button, Typography, message, Space, Spin, Modal, Form,
  InputNumber, DatePicker, Select, Input, Popconfirm,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { apApi } from '../../api/ap.api';
import { usePermission } from '../../hooks/usePermission';
import dayjs from 'dayjs';

const { Title } = Typography;

interface Payment {
  payment_id: string;
  payment_date: string;
  amount: string;
  payment_method: string;
  reference_no: string | null;
  notes: string | null;
  created_at: string;
}

interface Bill {
  bill_id: string;
  bill_number: string;
  vendor: { vendor_id: string; vendor_name: string; vendor_code: string };
  bill_date: string;
  due_date: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  paid_amount: string;
  currency: string;
  status: string;
  description: string | null;
  notes: string | null;
  payments: Payment[];
}

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  ISSUED: 'blue',
  PARTIALLY_PAID: 'orange',
  PAID: 'green',
  OVERDUE: 'red',
  VOID: 'default',
};

const paymentMethodLabels: Record<string, string> = {
  BANK_TRANSFER: 'ap.bankTransfer',
  CHECK: 'ap.check',
  CASH: 'ap.cash',
  CREDIT_CARD: 'ap.creditCard',
  OTHER: 'ap.other',
};

export function ApBillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentForm] = Form.useForm();
  const navigate = useNavigate();
  const canWrite = usePermission('ap.write');
  const { t } = useTranslation();

  const statusLabelMap: Record<string, string> = {
    DRAFT: t('ap.draft'),
    ISSUED: t('ap.issued'),
    PARTIALLY_PAID: t('ap.partiallyPaid'),
    PAID: t('ap.paid'),
    OVERDUE: t('ap.overdue'),
    VOID: t('ap.void'),
  };

  const fetchBill = () => {
    if (!id) return;
    setLoading(true);
    apApi
      .getBillById(id)
      .then((res) => setBill(res.data.data))
      .catch(() => message.error(t('ap.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBill();
  }, [id]);

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString('zh-TW', { minimumFractionDigits: 0 });

  const handleVoid = async () => {
    if (!id) return;
    try {
      await apApi.voidBill(id);
      message.success(t('ap.voidSuccess'));
      fetchBill();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('ap.voidFailed'));
    }
  };

  const handleAddPayment = async (values: any) => {
    if (!bill) return;
    setPaymentLoading(true);
    try {
      await apApi.createPayment({
        bill_id: bill.bill_id,
        payment_date: values.payment_date.format('YYYY-MM-DD'),
        amount: values.amount,
        payment_method: values.payment_method,
        reference_no: values.reference_no,
        notes: values.notes,
      });
      message.success(t('ap.paymentSuccess'));
      setPaymentModalOpen(false);
      paymentForm.resetFields();
      fetchBill();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('ap.paymentFailed'));
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return <Spin size="large" />;
  if (!bill) return null;

  const balance = Number(bill.total_amount) - Number(bill.paid_amount);
  const canAddPayment = canWrite && !['VOID', 'PAID'].includes(bill.status);
  const canVoid = canWrite && !['VOID', 'PAID'].includes(bill.status);

  const paymentColumns = [
    {
      title: t('ap.paymentDate'),
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: t('ap.paymentAmount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (v: string) => formatAmount(v),
    },
    {
      title: t('ap.paymentMethod'),
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (v: string) => t(paymentMethodLabels[v] || v),
    },
    { title: t('ap.referenceNo'), dataIndex: 'reference_no', key: 'reference_no', render: (v: string) => v || '-' },
    { title: t('ap.notes'), dataIndex: 'notes', key: 'notes', render: (v: string) => v || '-' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{bill.bill_number}</Title>
        <Space>
          {canAddPayment && (
            <Button type="primary" onClick={() => setPaymentModalOpen(true)}>
              {t('ap.addPayment')}
            </Button>
          )}
          {canVoid && (
            <Popconfirm title={t('ap.voidConfirm')} onConfirm={handleVoid} okText={t('common.save')} cancelText={t('common.cancel')}>
              <Button danger>{t('ap.voidBill')}</Button>
            </Popconfirm>
          )}
          <Button onClick={() => navigate('/ap/bills')}>{t('common.back')}</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label={t('ap.billNumber')}>{bill.bill_number}</Descriptions.Item>
          <Descriptions.Item label={t('ap.vendor')}>
            {bill.vendor?.vendor_code} - {bill.vendor?.vendor_name}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.status')}>
            <Tag color={statusColors[bill.status]}>{statusLabelMap[bill.status] || bill.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('ap.billDate')}>{dayjs(bill.bill_date).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label={t('ap.dueDate')}>{dayjs(bill.due_date).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label={t('ap.currency')}>{bill.currency}</Descriptions.Item>
          <Descriptions.Item label={t('ap.subtotal')}>{formatAmount(bill.subtotal)}</Descriptions.Item>
          <Descriptions.Item label={t('ap.taxAmount')}>{formatAmount(bill.tax_amount)}</Descriptions.Item>
          <Descriptions.Item label={t('ap.totalAmount')}><strong>{formatAmount(bill.total_amount)}</strong></Descriptions.Item>
          <Descriptions.Item label={t('ap.paidAmount')}>{formatAmount(bill.paid_amount)}</Descriptions.Item>
          <Descriptions.Item label={t('ap.balance')}><strong style={{ color: balance > 0 ? '#cf1322' : '#389e0d' }}>{formatAmount(balance)}</strong></Descriptions.Item>
          <Descriptions.Item label={t('ap.description')}>{bill.description || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('ap.notes')} span={3}>{bill.notes || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('ap.payments')}>
        {bill.payments?.length > 0 ? (
          <Table
            columns={paymentColumns}
            dataSource={bill.payments}
            rowKey="payment_id"
            pagination={false}
            size="small"
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>{t('ap.noPayments')}</div>
        )}
      </Card>

      <Modal
        title={t('ap.addPayment')}
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        footer={null}
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleAddPayment}
          initialValues={{
            payment_date: dayjs(),
            payment_method: 'BANK_TRANSFER',
            amount: balance > 0 ? balance : undefined,
          }}
        >
          <Form.Item name="payment_date" label={t('ap.paymentDate')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="amount" label={t('ap.paymentAmount')} rules={[{ required: true }]}>
            <InputNumber
              min={0.01}
              max={balance}
              style={{ width: '100%' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => v!.replace(/,/g, '') as any}
            />
          </Form.Item>
          <Form.Item name="payment_method" label={t('ap.paymentMethod')}>
            <Select
              options={[
                { value: 'BANK_TRANSFER', label: t('ap.bankTransfer') },
                { value: 'CHECK', label: t('ap.check') },
                { value: 'CASH', label: t('ap.cash') },
                { value: 'CREDIT_CARD', label: t('ap.creditCard') },
                { value: 'OTHER', label: t('ap.other') },
              ]}
            />
          </Form.Item>
          <Form.Item name="reference_no" label={t('ap.referenceNo')}>
            <Input />
          </Form.Item>
          <Form.Item name="notes" label={t('ap.notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={paymentLoading}>{t('common.save')}</Button>
              <Button onClick={() => setPaymentModalOpen(false)}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
