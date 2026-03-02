import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Select, InputNumber, Space, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { budgetsApi } from '../../api/budgets.api';
import { usePermission } from '../../hooks/usePermission';

const { Title } = Typography;

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  APPROVED: 'green',
  CLOSED: 'red',
};

interface Budget {
  budget_id: string;
  fiscal_year: number;
  name: string;
  status: string;
  description: string | null;
  _count: { lines: number };
}

export function BudgetListPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [fiscalYearFilter, setFiscalYearFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const navigate = useNavigate();
  const canWrite = usePermission('budget.write');
  const { t } = useTranslation();

  const statusLabelMap: Record<string, string> = {
    DRAFT: t('budgets.draft'),
    APPROVED: t('budgets.approved'),
    CLOSED: t('budgets.closed'),
  };

  const fetchBudgets = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (fiscalYearFilter) params.fiscal_year = fiscalYearFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await budgetsApi.list(params);
      setBudgets(res.data.data);
      setPagination({
        current: res.data.meta.page,
        pageSize: res.data.meta.limit,
        total: res.data.meta.total,
      });
    } catch {
      message.error(t('budgets.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const columns = [
    { title: t('budgets.fiscalYear'), dataIndex: 'fiscal_year', key: 'fiscal_year', width: 120 },
    { title: t('budgets.name'), dataIndex: 'name', key: 'name' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{statusLabelMap[status] || status}</Tag>
      ),
    },
    {
      title: t('budgets.lineCount'),
      key: 'line_count',
      width: 100,
      render: (_: unknown, record: Budget) => record._count?.lines ?? 0,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Budget) => (
        <Button type="link" onClick={() => navigate(`/budgets/${record.budget_id}`)}>
          {t('budgets.detail')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('budgets.title')}</Title>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/budgets/create')}>
            {t('budgets.createBudget')}
          </Button>
        )}
      </div>
      <Space style={{ marginBottom: 16 }} wrap>
        <InputNumber
          placeholder={t('budgets.fiscalYear')}
          style={{ width: 140 }}
          value={fiscalYearFilter}
          onChange={(v) => setFiscalYearFilter(v)}
          min={2000}
          max={2100}
        />
        <Select
          placeholder={t('budgets.statusFilter')}
          allowClear
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: 'DRAFT', label: t('budgets.draft') },
            { value: 'APPROVED', label: t('budgets.approved') },
            { value: 'CLOSED', label: t('budgets.closed') },
          ]}
        />
        <Button onClick={() => fetchBudgets(1)}>{t('common.search')}</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={budgets}
        rowKey="budget_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
          onChange: (page, pageSize) => fetchBudgets(page, pageSize),
        }}
      />
    </div>
  );
}
