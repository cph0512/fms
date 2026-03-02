import { useState } from 'react';
import { Card, Table, DatePicker, Button, Typography, message, Space, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { reportsApi } from '../../api/reports.api';

const { Title, Text } = Typography;

interface BalanceSheetAccount {
  account_id: string;
  account_code: string;
  account_name: string;
  balance: number;
}

interface BalanceSheetData {
  as_of_date: string;
  assets: BalanceSheetAccount[];
  liabilities: BalanceSheetAccount[];
  equity: BalanceSheetAccount[];
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  retained_earnings: number;
}

export function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState<dayjs.Dayjs | null>(null);
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (asOfDate) {
        params.as_of_date = asOfDate.format('YYYY-MM-DD');
      }
      const res = await reportsApi.getBalanceSheet(params);
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
      <Title level={3}>{t('reports.balanceSheet')}</Title>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Text strong>{t('gl.asOfDate')}</Text>
          <DatePicker value={asOfDate} onChange={(v) => setAsOfDate(v)} />
          <Button type="primary" onClick={fetchBalanceSheet}>{t('common.search')}</Button>
        </Space>
      </Card>

      {data && (
        <>
          <Card title={t('reports.assets')} style={{ marginBottom: 16 }}>
            <Table
              dataSource={data.assets}
              columns={columns}
              rowKey="account_id"
              loading={loading}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>{t('reports.totalAssets')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <Text strong>{formatAmount(data.total_assets)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          <Card title={t('reports.liabilities')} style={{ marginBottom: 16 }}>
            <Table
              dataSource={data.liabilities}
              columns={columns}
              rowKey="account_id"
              loading={loading}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>{t('reports.totalLiabilities')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <Text strong>{formatAmount(data.total_liabilities)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          <Card title={t('reports.equity')} style={{ marginBottom: 16 }}>
            <Table
              dataSource={data.equity}
              columns={columns}
              rowKey="account_id"
              loading={loading}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>{t('reports.totalEquity')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <Text strong>{formatAmount(data.total_equity)}</Text>
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
                <Text strong>{t('reports.totalAssets')}</Text>
                <Text strong>{formatAmount(data.total_assets)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>{t('reports.totalLiabilities')}</Text>
                <Text strong>{formatAmount(data.total_liabilities)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>{t('reports.retainedEarnings')}</Text>
                <Text strong>{formatAmount(data.retained_earnings)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>{t('reports.totalEquity')}</Text>
                <Text strong>{formatAmount(data.total_equity)}</Text>
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: 16 }}>{t('reports.totalLiabilitiesAndEquity')}</Text>
                <Text strong style={{ fontSize: 16 }}>{formatAmount(data.total_liabilities + data.total_equity + data.retained_earnings)}</Text>
              </div>
            </Space>
          </Card>
        </>
      )}
    </div>
  );
}
