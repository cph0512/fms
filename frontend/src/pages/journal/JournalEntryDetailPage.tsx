import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Descriptions, Tag, Table, Button, Typography, message, Space, Spin, Popconfirm } from 'antd';
import { useTranslation } from 'react-i18next';
import { journalApi } from '../../api/journal.api';
import { usePermission } from '../../hooks/usePermission';
import dayjs from 'dayjs';

const { Title } = Typography;

interface JournalLine {
  line_id: string;
  account: { account_id: string; account_code: string; account_name: string };
  debit_amount: string;
  credit_amount: string;
  description: string | null;
}

interface JournalEntry {
  entry_id: string;
  entry_number: string;
  entry_date: string;
  description: string | null;
  status: string;
  posted_at: string | null;
  created_at: string;
  lines: JournalLine[];
}

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  POSTED: 'green',
  VOID: 'red',
};

export function JournalEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const canWrite = usePermission('accounting.write');
  const { t } = useTranslation();

  const statusLabelMap: Record<string, string> = {
    DRAFT: t('journal.draft'),
    POSTED: t('journal.posted'),
    VOID: t('journal.void'),
  };

  const fetchEntry = () => {
    if (!id) return;
    setLoading(true);
    journalApi
      .getEntryById(id)
      .then((res) => setEntry(res.data.data))
      .catch(() => message.error(t('journal.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEntry();
  }, [id]);

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString('zh-TW', { minimumFractionDigits: 0 });

  const handlePost = async () => {
    if (!id) return;
    try {
      await journalApi.postEntry(id);
      message.success(t('journal.postSuccess'));
      fetchEntry();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('journal.postFailed'));
    }
  };

  const handleVoid = async () => {
    if (!id) return;
    try {
      await journalApi.voidEntry(id);
      message.success(t('journal.voidSuccess'));
      fetchEntry();
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('journal.voidFailed'));
    }
  };

  if (loading) return <Spin size="large" />;
  if (!entry) return null;

  const totalDebit = (entry.lines || []).reduce((s, l) => s + Number(l.debit_amount || 0), 0);
  const totalCredit = (entry.lines || []).reduce((s, l) => s + Number(l.credit_amount || 0), 0);
  const canPost = canWrite && entry.status === 'DRAFT';
  const canVoid = canWrite && entry.status === 'DRAFT';

  const lineColumns = [
    {
      title: t('journal.account'),
      key: 'account',
      render: (_: unknown, record: JournalLine) =>
        record.account ? `${record.account.account_code} ${record.account.account_name}` : '-',
    },
    {
      title: t('journal.debit'),
      dataIndex: 'debit_amount',
      key: 'debit_amount',
      align: 'right' as const,
      render: (v: string) => (Number(v) > 0 ? formatAmount(v) : '-'),
    },
    {
      title: t('journal.credit'),
      dataIndex: 'credit_amount',
      key: 'credit_amount',
      align: 'right' as const,
      render: (v: string) => (Number(v) > 0 ? formatAmount(v) : '-'),
    },
    {
      title: t('journal.lineDescription'),
      dataIndex: 'description',
      key: 'description',
      render: (v: string) => v || '-',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{entry.entry_number}</Title>
        <Space>
          {canPost && (
            <Popconfirm title={t('journal.postConfirm')} onConfirm={handlePost} okText={t('common.save')} cancelText={t('common.cancel')}>
              <Button type="primary">{t('journal.post')}</Button>
            </Popconfirm>
          )}
          {canVoid && (
            <Popconfirm title={t('journal.voidConfirm')} onConfirm={handleVoid} okText={t('common.save')} cancelText={t('common.cancel')}>
              <Button danger>{t('journal.voidEntry')}</Button>
            </Popconfirm>
          )}
          <Button onClick={() => navigate('/journal/entries')}>{t('common.back')}</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label={t('journal.entryNumber')}>{entry.entry_number}</Descriptions.Item>
          <Descriptions.Item label={t('journal.entryDate')}>{dayjs(entry.entry_date).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label={t('common.status')}>
            <Tag color={statusColors[entry.status]}>{statusLabelMap[entry.status] || entry.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('journal.description')} span={3}>{entry.description || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('journal.postedAt')}>
            {entry.posted_at ? dayjs(entry.posted_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('journal.createdAt')}>
            {dayjs(entry.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('journal.lines')}>
        <Table
          columns={lineColumns}
          dataSource={entry.lines}
          rowKey="line_id"
          pagination={false}
          size="small"
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <strong>{t('journal.total')}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <strong>{formatAmount(totalDebit)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <strong>{formatAmount(totalCredit)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} />
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  );
}
