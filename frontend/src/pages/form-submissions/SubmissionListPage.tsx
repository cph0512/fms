import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Select, Typography, message, Space, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { formSubmissionsApi } from '../../api/form-submissions.api';
import dayjs from 'dayjs';

const { Title } = Typography;

interface SubmissionRow {
  row_id: string;
  amount: string;
  trips_count: number;
}

interface Submission {
  submission_id: string;
  submitter_name: string;
  customer_name: string;
  status: string;
  submitted_at: string;
  rows: SubmissionRow[];
}

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  IMPORTED: 'green',
  REJECTED: 'default',
};

const statusLabels: Record<string, string> = {
  PENDING: '待審核',
  IMPORTED: '已匯入',
  REJECTED: '已拒絕',
};

export function SubmissionListPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchSubmissions = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      const res = await formSubmissionsApi.list(params);
      setSubmissions(res.data.data);
      setPagination({
        current: res.data.meta.page,
        pageSize: res.data.meta.limit,
        total: res.data.meta.total,
      });
    } catch {
      message.error(t('common.loading') + '失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const formatAmount = (val: number | string) =>
    Number(val).toLocaleString('zh-TW', { minimumFractionDigits: 0 });

  const columns = [
    {
      title: '提交時間',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 170,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '提交者',
      dataIndex: 'submitter_name',
      key: 'submitter_name',
      width: 120,
    },
    {
      title: '客戶名稱',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: '明細筆數',
      key: 'row_count',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: Submission) => record.rows?.length || 0,
    },
    {
      title: '總金額',
      key: 'total_amount',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, record: Submission) => {
        const total = record.rows?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
        return `$${formatAmount(total)}`;
      },
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{statusLabels[status] || status}</Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Submission) => (
        <Button type="link" onClick={() => navigate(`/form-submissions/${record.submission_id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>表單提交</Title>
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="篩選狀態"
          allowClear
          style={{ width: 150 }}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: 'PENDING', label: '待審核' },
            { value: 'IMPORTED', label: '已匯入' },
            { value: 'REJECTED', label: '已拒絕' },
          ]}
        />
        <Button onClick={() => fetchSubmissions(1)}>{t('common.search')}</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={submissions}
        rowKey="submission_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
          onChange: (page, pageSize) => fetchSubmissions(page, pageSize),
        }}
      />
    </div>
  );
}
