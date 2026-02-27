import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Select, Space, Typography, message, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { arApi } from '../../api/ar.api';
import { usePermission } from '../../hooks/usePermission';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

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
}

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  ISSUED: 'blue',
  PARTIALLY_PAID: 'orange',
  PAID: 'green',
  OVERDUE: 'red',
  VOID: 'default',
};

export function ArInvoiceListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
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

  const fetchInvoices = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      if (dateRange) {
        params.from_date = dateRange[0].format('YYYY-MM-DD');
        params.to_date = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await arApi.listInvoices(params);
      setInvoices(res.data.data);
      setPagination({
        current: res.data.meta.page,
        pageSize: res.data.meta.limit,
        total: res.data.meta.total,
      });
    } catch {
      message.error(t('ar.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString('zh-TW', { minimumFractionDigits: 0 });

  const columns = [
    { title: t('ar.invoiceNumber'), dataIndex: 'invoice_number', key: 'invoice_number', width: 160 },
    {
      title: t('ar.customer'),
      key: 'customer',
      render: (_: unknown, record: Invoice) => record.customer?.customer_name || '-',
    },
    {
      title: t('ar.invoiceDate'),
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: t('ar.dueDate'),
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: t('ar.totalAmount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right' as const,
      render: (v: string) => formatAmount(v),
    },
    {
      title: t('ar.paidAmount'),
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      align: 'right' as const,
      render: (v: string) => formatAmount(v),
    },
    {
      title: t('ar.balance'),
      key: 'balance',
      align: 'right' as const,
      render: (_: unknown, record: Invoice) => formatAmount(Number(record.total_amount) - Number(record.paid_amount)),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{statusLabelMap[status] || status}</Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, record: Invoice) => (
        <Button type="link" onClick={() => navigate(`/ar/invoices/${record.invoice_id}`)}>
          {t('ar.invoiceDetail')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('ar.invoices')}</Title>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/ar/invoices/create')}>
            {t('ar.createInvoice')}
          </Button>
        )}
      </div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder={t('ar.statusFilter')}
          allowClear
          style={{ width: 180 }}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: 'DRAFT', label: t('ar.draft') },
            { value: 'ISSUED', label: t('ar.issued') },
            { value: 'PARTIALLY_PAID', label: t('ar.partiallyPaid') },
            { value: 'PAID', label: t('ar.paid') },
            { value: 'OVERDUE', label: t('ar.overdue') },
            { value: 'VOID', label: t('ar.void') },
          ]}
        />
        <RangePicker onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
        <Button onClick={() => fetchInvoices(1)}>{t('common.search')}</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={invoices}
        rowKey="invoice_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
          onChange: (page, pageSize) => fetchInvoices(page, pageSize),
        }}
      />
    </div>
  );
}
