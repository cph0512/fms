import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Table, Button, Typography, message, Space, Spin, Modal, Form,
  InputNumber, DatePicker, Select, Input, Popconfirm,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { arApi } from '../../api/ar.api';
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

interface Invoice {
  invoice_id: string;
  invoice_number: string;
  customer: { customer_id: string; customer_name: string; customer_code: string };
  invoice_date: string;
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
  BANK_TRANSFER: 'ar.bankTransfer',
  CHECK: 'ar.check',
  CASH: 'ar.cash',
  CREDIT_CARD: 'ar.creditCard',
  OTHER: 'ar.other',
};

export function ArInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentForm] = Form.useForm();
  const navigate = useNavigate();
  const canWrite = usePermission('ar.write');
  const { t } = useTranslation();

  const statusLabelMap: Record<string, string> = {
    DRAFT: t('ar.draft'),
    ISSUED: t('ar.issued'),
    PARTIALLY_PAID: t('ar.partiallyPaid'),
    PAID: t('ar.paid'),
    OVERDUE: t('ar.overdue'),
    VOID: t('ar.void'),
  };

  const fetchInvoice = () => {
    if (!id) return;
    setLoading(true);
    arApi
      .getInvoiceById(id)
      .then((res) => setInvoice(res.data.data))
      .catch(() => message.error(t('ar.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString('zh-TW', { minimumFractionDigits: 0 });

  const handleVoid = async () => {
    if (!id) return;
    try {
      await arApi.voidInvoice(id);
      message.success(t('ar.voidSuccess'));
      fetchInvoice();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('ar.voidFailed'));
    }
  };

  const handleAddPayment = async (values: any) => {
    if (!invoice) return;
    setPaymentLoading(true);
    try {
      await arApi.createPayment({
        invoice_id: invoice.invoice_id,
        payment_date: values.payment_date.format('YYYY-MM-DD'),
        amount: values.amount,
        payment_method: values.payment_method,
        reference_no: values.reference_no,
        notes: values.notes,
      });
      message.success(t('ar.paymentSuccess'));
      setPaymentModalOpen(false);
      paymentForm.resetFields();
      fetchInvoice();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('ar.paymentFailed'));
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return <Spin size="large" />;
  if (!invoice) return null;

  const balance = Number(invoice.total_amount) - Number(invoice.paid_amount);
  const canAddPayment = canWrite && !['VOID', 'PAID'].includes(invoice.status);
  const canVoid = canWrite && !['VOID', 'PAID'].includes(invoice.status);

  const paymentColumns = [
    {
      title: t('ar.paymentDate'),
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: t('ar.paymentAmount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (v: string) => formatAmount(v),
    },
    {
      title: t('ar.paymentMethod'),
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (v: string) => t(paymentMethodLabels[v] || v),
    },
    { title: t('ar.referenceNo'), dataIndex: 'reference_no', key: 'reference_no', render: (v: string) => v || '-' },
    { title: t('ar.notes'), dataIndex: 'notes', key: 'notes', render: (v: string) => v || '-' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{invoice.invoice_number}</Title>
        <Space>
          {canAddPayment && (
            <Button type="primary" onClick={() => setPaymentModalOpen(true)}>
              {t('ar.addPayment')}
            </Button>
          )}
          {canVoid && (
            <Popconfirm title={t('ar.voidConfirm')} onConfirm={handleVoid} okText={t('common.save')} cancelText={t('common.cancel')}>
              <Button danger>{t('ar.voidInvoice')}</Button>
            </Popconfirm>
          )}
          <Button onClick={() => navigate('/ar/invoices')}>{t('common.back')}</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label={t('ar.invoiceNumber')}>{invoice.invoice_number}</Descriptions.Item>
          <Descriptions.Item label={t('ar.customer')}>
            {invoice.customer?.customer_code} - {invoice.customer?.customer_name}
          </Descriptions.Item>
          <Descriptions.Item label={t('common.status')}>
            <Tag color={statusColors[invoice.status]}>{statusLabelMap[invoice.status] || invoice.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('ar.invoiceDate')}>{dayjs(invoice.invoice_date).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label={t('ar.dueDate')}>{dayjs(invoice.due_date).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label={t('ar.currency')}>{invoice.currency}</Descriptions.Item>
          <Descriptions.Item label={t('ar.subtotal')}>{formatAmount(invoice.subtotal)}</Descriptions.Item>
          <Descriptions.Item label={t('ar.taxAmount')}>{formatAmount(invoice.tax_amount)}</Descriptions.Item>
          <Descriptions.Item label={t('ar.totalAmount')}><strong>{formatAmount(invoice.total_amount)}</strong></Descriptions.Item>
          <Descriptions.Item label={t('ar.paidAmount')}>{formatAmount(invoice.paid_amount)}</Descriptions.Item>
          <Descriptions.Item label={t('ar.balance')}><strong style={{ color: balance > 0 ? '#cf1322' : '#389e0d' }}>{formatAmount(balance)}</strong></Descriptions.Item>
          <Descriptions.Item label={t('ar.description')}>{invoice.description || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('ar.notes')} span={3}>{invoice.notes || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('ar.payments')}>
        {invoice.payments?.length > 0 ? (
          <Table
            columns={paymentColumns}
            dataSource={invoice.payments}
            rowKey="payment_id"
            pagination={false}
            size="small"
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>{t('ar.noPayments')}</div>
        )}
      </Card>

      <Modal
        title={t('ar.addPayment')}
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
          <Form.Item name="payment_date" label={t('ar.paymentDate')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="amount" label={t('ar.paymentAmount')} rules={[{ required: true }]}>
            <InputNumber
              min={0.01}
              max={balance}
              style={{ width: '100%' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => v!.replace(/,/g, '') as any}
            />
          </Form.Item>
          <Form.Item name="payment_method" label={t('ar.paymentMethod')}>
            <Select
              options={[
                { value: 'BANK_TRANSFER', label: t('ar.bankTransfer') },
                { value: 'CHECK', label: t('ar.check') },
                { value: 'CASH', label: t('ar.cash') },
                { value: 'CREDIT_CARD', label: t('ar.creditCard') },
                { value: 'OTHER', label: t('ar.other') },
              ]}
            />
          </Form.Item>
          <Form.Item name="reference_no" label={t('ar.referenceNo')}>
            <Input />
          </Form.Item>
          <Form.Item name="notes" label={t('ar.notes')}>
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
