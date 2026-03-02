import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Select, Space, Typography, message, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { journalApi } from '../../api/journal.api';
import { usePermission } from '../../hooks/usePermission';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface JournalLine {
  debit_amount: string;
  credit_amount: string;
}

interface JournalEntry {
  entry_id: string;
  entry_number: string;
  entry_date: string;
  description: string | null;
  status: string;
  lines: JournalLine[];
}

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  POSTED: 'green',
  VOID: 'red',
};

export function JournalEntryListPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const navigate = useNavigate();
  const canWrite = usePermission('accounting.write');
  const { t } = useTranslation();

  const statusLabelMap: Record<string, string> = {
    DRAFT: t('journal.draft'),
    POSTED: t('journal.posted'),
    VOID: t('journal.void'),
  };

  const fetchEntries = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      if (dateRange) {
        params.from_date = dateRange[0].format('YYYY-MM-DD');
        params.to_date = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await journalApi.listEntries(params);
      setEntries(res.data.data);
      setPagination({
        current: res.data.meta.page,
        pageSize: res.data.meta.limit,
        total: res.data.meta.total,
      });
    } catch {
      message.error(t('journal.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString('zh-TW', { minimumFractionDigits: 0 });

  const columns = [
    { title: t('journal.entryNumber'), dataIndex: 'entry_number', key: 'entry_number', width: 160 },
    {
      title: t('journal.entryDate'),
      dataIndex: 'entry_date',
      key: 'entry_date',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    { title: t('journal.description'), dataIndex: 'description', key: 'description', render: (v: string) => v || '-' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{statusLabelMap[status] || status}</Tag>
      ),
    },
    {
      title: t('journal.totalDebit'),
      key: 'total_debit',
      align: 'right' as const,
      render: (_: unknown, record: JournalEntry) => {
        const total = (record.lines || []).reduce((s, l) => s + Number(l.debit_amount || 0), 0);
        return formatAmount(total);
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, record: JournalEntry) => (
        <Button type="link" onClick={() => navigate(`/journal/entries/${record.entry_id}`)}>
          {t('journal.detail')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('journal.entries')}</Title>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/journal/entries/create')}>
            {t('journal.createEntry')}
          </Button>
        )}
      </div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder={t('journal.statusFilter')}
          allowClear
          style={{ width: 180 }}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: 'DRAFT', label: t('journal.draft') },
            { value: 'POSTED', label: t('journal.posted') },
            { value: 'VOID', label: t('journal.void') },
          ]}
        />
        <RangePicker onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
        <Button onClick={() => fetchEntries(1)}>{t('common.search')}</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={entries}
        rowKey="entry_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
          onChange: (page, pageSize) => fetchEntries(page, pageSize),
        }}
      />
    </div>
  );
}
