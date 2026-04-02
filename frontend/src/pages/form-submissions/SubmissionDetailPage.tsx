import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Table, Button, Typography, message, Space, Spin, Popconfirm,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { formSubmissionsApi } from '../../api/form-submissions.api';
import { usePermission } from '../../hooks/usePermission';
import dayjs from 'dayjs';

const { Title } = Typography;

interface SubmissionRow {
  row_id: string;
  row_date: string;
  route_content: string;
  description: string | null;
  trips_count: number;
  amount: string;
  row_order: number;
}

interface Submission {
  submission_id: string;
  submitter_name: string;
  customer_name: string;
  notes: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
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

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const canWrite = usePermission('delivery.write');
  const { t } = useTranslation();

  const fetchSubmission = () => {
    if (!id) return;
    setLoading(true);
    formSubmissionsApi
      .getById(id)
      .then((res) => setSubmission(res.data.data))
      .catch(() => message.error('載入失敗'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const handleReview = async (status: string) => {
    if (!id) return;
    try {
      await formSubmissionsApi.review(id, status);
      message.success(status === 'IMPORTED' ? '已標記為匯入' : '已拒絕');
      fetchSubmission();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || '操作失敗');
    }
  };

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString('zh-TW', { minimumFractionDigits: 0 });

  if (loading) return <Spin size="large" />;
  if (!submission) return null;

  const totalAmount = submission.rows.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalTrips = submission.rows.reduce((sum, r) => sum + r.trips_count, 0);
  const isPending = submission.status === 'PENDING';

  const rowColumns = [
    {
      title: '日期',
      dataIndex: 'row_date',
      key: 'row_date',
      width: 120,
    },
    {
      title: '請款內容',
      dataIndex: 'route_content',
      key: 'route_content',
    },
    {
      title: '內容',
      dataIndex: 'description',
      key: 'description',
      render: (v: string | null) => v || '-',
    },
    {
      title: '趟次',
      dataIndex: 'trips_count',
      key: 'trips_count',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '請款金額',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right' as const,
      render: (v: string) => `$${formatAmount(v)}`,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>表單提交詳情</Title>
        <Space>
          {canWrite && isPending && (
            <>
              <Popconfirm title="確定標記為已匯入？" onConfirm={() => handleReview('IMPORTED')}>
                <Button type="primary">標記已匯入</Button>
              </Popconfirm>
              <Popconfirm title="確定拒絕此提交？" onConfirm={() => handleReview('REJECTED')}>
                <Button danger>拒絕</Button>
              </Popconfirm>
            </>
          )}
          <Button onClick={() => navigate('/form-submissions')}>{t('common.back')}</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="提交者">{submission.submitter_name}</Descriptions.Item>
          <Descriptions.Item label="客戶名稱">{submission.customer_name}</Descriptions.Item>
          <Descriptions.Item label="狀態">
            <Tag color={statusColors[submission.status]}>{statusLabels[submission.status] || submission.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="提交時間">{dayjs(submission.submitted_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="總趟次">{totalTrips}</Descriptions.Item>
          <Descriptions.Item label="總金額"><strong>${formatAmount(totalAmount)}</strong></Descriptions.Item>
          <Descriptions.Item label="備註" span={3}>{submission.notes || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="請款明細">
        <Table
          columns={rowColumns}
          dataSource={submission.rows}
          rowKey="row_id"
          pagination={false}
          size="small"
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}><strong>合計</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="center"><strong>{totalTrips}</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right"><strong>${formatAmount(totalAmount)}</strong></Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  );
}
