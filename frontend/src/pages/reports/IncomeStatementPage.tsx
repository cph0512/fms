import { useState } from 'react';
import { Card, Table, DatePicker, Button, Typography, message, Space, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { reportsApi } from '../../api/reports.api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface IncomeStatementAccount {
  account_id: string;
  account_code: string;
  account_name: string;
  balance: number;
}

interface IncomeStatementData {
  from_date: string;
  to_date: string;
  revenue: IncomeStatementAccount[];
  expenses: IncomeStatementAccount[];
  total_revenue: number;
  total_expenses: number;
  net_income: number;
}

export function IncomeStatementPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [data, setData] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const fetchIncomeStatement = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange) {
        params.from_date = dateRange[0].format('YYYY-MM-DD');
        params.to_date = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await reportsApi.getIncomeStatement(params);
      setData(res.data.data);
    } catch {
      message.error(t('reports.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (v: number) => Number(v).toLocaleString('zh-TW');

  const columns = [
    { title: t('gl.accountCode'), dataIndex: 'account_code', key: 'account_code', width: 120 },
    { title: t('gl.accountName'), dataIndex: 'account_name', key: 'account_name' },
    {
      title: t('reports.balance'),
      dataIndex: 'balance',
      key: 'balance',
      width: 160,
      align: 'right' as const,
      render: (v: number) => formatAmount(v),
    },
  ];

  return (
    <div>
      <Title level={3}>{t('reports.incomeStatement')}</Title>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Text strong>{t('gl.dateRange')}</Text>
          <RangePicker value={dateRange} onChange={(v) => setDateRange(v as any)} />
          <Button type="primary" onClick={fetchIncomeStatement}>{t('common.search')}</Button>
        </Space>
      </Card>

      {data && (
        <>
          <Card title={t('reports.revenue')} style={{ marginBottom: 16 }}>
            <Table
              dataSource={data.revenue}
              columns={columns}
              rowKey="account_id"
              loading={loading}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>{t('reports.totalRevenue')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <Text strong>{formatAmount(data.total_revenue)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          <Card title={t('reports.expenses')} style={{ marginBottom: 16 }}>
            <Table
              dataSource={data.expenses}
              columns={columns}
              rowKey="account_id"
              loading={loading}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>{t('reports.totalExpenses')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <Text strong>{formatAmount(data.total_expenses)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          <Card>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>{t('reports.totalRevenue')}</Text>
                <Text strong>{formatAmount(data.total_revenue)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>{t('reports.totalExpenses')}</Text>
                <Text strong>{formatAmount(data.total_expenses)}</Text>
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: 18 }}>{t('reports.netIncome')}</Text>
                <Text strong style={{ fontSize: 18, color: data.net_income >= 0 ? '#389e0d' : '#cf1322' }}>
                  {formatAmount(data.net_income)}
                </Text>
              </div>
            </Space>
          </Card>
        </>
      )}
    </div>
  );
}
