import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Table, Button, Typography, message, Space, Spin, Modal,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { budgetsApi } from '../../api/budgets.api';

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  APPROVED: 'green',
  CLOSED: 'red',
};

const MONTH_KEYS = [
  'month_01', 'month_02', 'month_03', 'month_04', 'month_05', 'month_06',
  'month_07', 'month_08', 'month_09', 'month_10', 'month_11', 'month_12',
] as const;

interface BudgetLine {
  line_id: string;
  account: {
    account_id: string;
    account_code: string;
    account_name: string;
  };
  month_01: number;
  month_02: number;
  month_03: number;
  month_04: number;
  month_05: number;
  month_06: number;
  month_07: number;
  month_08: number;
  month_09: number;
  month_10: number;
  month_11: number;
  month_12: number;
}

interface Budget {
  budget_id: string;
  fiscal_year: number;
  name: string;
  status: string;
  description: string | null;
  lines: BudgetLine[];
}

interface VsActualLine {
  account_code: string;
  account_name: string;
  budget_total: number;
  actual_total: number;
  variance: number;
}

export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);
  const [vsActualData, setVsActualData] = useState<VsActualLine[]>([]);
  const [vsActualOpen, setVsActualOpen] = useState(false);
  const [vsActualLoading, setVsActualLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const statusLabelMap: Record<string, string> = {
    DRAFT: t('budgets.draft'),
    APPROVED: t('budgets.approved'),
    CLOSED: t('budgets.closed'),
  };

  const fetchBudget = () => {
    if (!id) return;
    setLoading(true);
    budgetsApi
      .getById(id)
      .then((res) => setBudget(res.data.data))
      .catch(() => message.error(t('budgets.loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBudget();
  }, [id]);

  const fetchVsActual = async () => {
    if (!id) return;
    setVsActualLoading(true);
    try {
      const res = await budgetsApi.getVsActual(id);
      setVsActualData(res.data.data);
      setVsActualOpen(true);
    } catch {
      message.error(t('budgets.vsActualFailed'));
    } finally {
      setVsActualLoading(false);
    }
  };

  const formatAmount = (v: number) => Number(v).toLocaleString('zh-TW');

  const getLineTotal = (line: BudgetLine) =>
    MONTH_KEYS.reduce((sum, key) => sum + Number(line[key] || 0), 0);

  if (loading) return <Spin size="large" />;
  if (!budget) return null;

  const monthLabels = [
    t('budgets.jan'), t('budgets.feb'), t('budgets.mar'),
    t('budgets.apr'), t('budgets.may'), t('budgets.jun'),
    t('budgets.jul'), t('budgets.aug'), t('budgets.sep'),
    t('budgets.oct'), t('budgets.nov'), t('budgets.dec'),
  ];

  const lineColumns = [
    {
      title: t('gl.accountCode'),
      key: 'account_code',
      width: 100,
      fixed: 'left' as const,
      render: (_: unknown, record: BudgetLine) => record.account?.account_code,
    },
    {
      title: t('gl.accountName'),
      key: 'account_name',
      width: 160,
      fixed: 'left' as const,
      render: (_: unknown, record: BudgetLine) => record.account?.account_name,
    },
    ...MONTH_KEYS.map((key, idx) => ({
      title: monthLabels[idx],
      dataIndex: key,
      key,
      width: 110,
      align: 'right' as const,
      render: (v: number) => formatAmount(v || 0),
    })),
    {
      title: t('budgets.total'),
      key: 'total',
      width: 130,
      fixed: 'right' as const,
      align: 'right' as const,
      render: (_: unknown, record: BudgetLine) => (
        <Text strong>{formatAmount(getLineTotal(record))}</Text>
      ),
    },
  ];

  const vsActualColumns = [
    { title: t('gl.accountCode'), dataIndex: 'account_code', key: 'account_code', width: 120 },
    { title: t('gl.accountName'), dataIndex: 'account_name', key: 'account_name' },
    {
      title: t('budgets.budgetAmount'),
      dataIndex: 'budget_total',
      key: 'budget_total',
      width: 150,
      align: 'right' as const,
      render: (v: number) => formatAmount(v),
    },
    {
      title: t('budgets.actualAmount'),
      dataIndex: 'actual_total',
      key: 'actual_total',
      width: 150,
      align: 'right' as const,
      render: (v: number) => formatAmount(v),
    },
    {
      title: t('budgets.variance'),
      dataIndex: 'variance',
      key: 'variance',
      width: 150,
      align: 'right' as const,
      render: (v: number) => (
        <Text style={{ color: v >= 0 ? '#389e0d' : '#cf1322' }}>{formatAmount(v)}</Text>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{budget.name}</Title>
        <Space>
          <Button onClick={fetchVsActual} loading={vsActualLoading}>{t('budgets.vsActual')}</Button>
          <Button onClick={() => navigate('/budgets')}>{t('common.back')}</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label={t('budgets.fiscalYear')}>{budget.fiscal_year}</Descriptions.Item>
          <Descriptions.Item label={t('budgets.name')}>{budget.name}</Descriptions.Item>
          <Descriptions.Item label={t('common.status')}>
            <Tag color={statusColors[budget.status]}>{statusLabelMap[budget.status] || budget.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('budgets.description')} span={3}>{budget.description || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('budgets.budgetLines')}>
        <Table
          dataSource={budget.lines}
          columns={lineColumns}
          rowKey="line_id"
          pagination={false}
          size="small"
          scroll={{ x: 1800 }}
        />
      </Card>

      <Modal
        title={t('budgets.vsActual')}
        open={vsActualOpen}
        onCancel={() => setVsActualOpen(false)}
        footer={null}
        width={900}
      >
        <Table
          dataSource={vsActualData}
          columns={vsActualColumns}
          rowKey="account_code"
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
}
