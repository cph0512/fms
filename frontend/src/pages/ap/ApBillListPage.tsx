import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Select, Space, Typography, message, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { apApi } from '../../api/ap.api';
import { usePermission } from '../../hooks/usePermission';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

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
}

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  ISSUED: 'blue',
  PARTIALLY_PAID: 'orange',
  PAID: 'green',
  OVERDUE: 'red',
  VOID: 'default',
};

export function ApBillListPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
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

  const fetchBills = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      if (dateRange) {
        params.from_date = dateRange[0].format('YYYY-MM-DD');
        params.to_date = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await apApi.listBills(params);
      setBills(res.data.data);
      setPagination({
        current: res.data.meta.page,
        pageSize: res.data.meta.limit,
        total: res.data.meta.total,
      });
    } catch {
      message.error(t('ap.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString('zh-TW', { minimumFractionDigits: 0 });

  const columns = [
    { title: t('ap.billNumber'), dataIndex: 'bill_number', key: 'bill_number', width: 160 },
    {
      title: t('ap.vendor'),
      key: 'vendor',
      render: (_: unknown, record: Bill) => record.vendor?.vendor_name || '-',
    },
    {
      title: t('ap.billDate'),
      dataIndex: 'bill_date',
      key: 'bill_date',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: t('ap.dueDate'),
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: t('ap.totalAmount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right' as const,
      render: (v: string) => formatAmount(v),
    },
    {
      title: t('ap.paidAmount'),
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      align: 'right' as const,
      render: (v: string) => formatAmount(v),
    },
    {
      title: t('ap.balance'),
      key: 'balance',
      align: 'right' as const,
      render: (_: unknown, record: Bill) => formatAmount(Number(record.total_amount) - Number(record.paid_amount)),
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
      render: (_: unknown, record: Bill) => (
        <Button type="link" onClick={() => navigate(`/ap/bills/${record.bill_id}`)}>
          {t('ap.billDetail')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('ap.bills')}</Title>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/ap/bills/create')}>
            {t('ap.createBill')}
          </Button>
        )}
      </div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder={t('ap.statusFilter')}
          allowClear
          style={{ width: 180 }}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: 'DRAFT', label: t('ap.draft') },
            { value: 'ISSUED', label: t('ap.issued') },
            { value: 'PARTIALLY_PAID', label: t('ap.partiallyPaid') },
            { value: 'PAID', label: t('ap.paid') },
            { value: 'OVERDUE', label: t('ap.overdue') },
            { value: 'VOID', label: t('ap.void') },
          ]}
        />
        <RangePicker onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
        <Button onClick={() => fetchBills(1)}>{t('common.search')}</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={bills}
        rowKey="bill_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
          onChange: (page, pageSize) => fetchBills(page, pageSize),
        }}
      />
    </div>
  );
}
