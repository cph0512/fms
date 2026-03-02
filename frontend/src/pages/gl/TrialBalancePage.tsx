import { useState } from 'react';
import { Card, Table, DatePicker, Button, Typography, message, Tag, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { glApi } from '../../api/gl.api';

const { Title, Text } = Typography;

const accountTypeColors: Record<string, string> = {
  ASSET: 'blue',
  LIABILITY: 'orange',
  EQUITY: 'purple',
  REVENUE: 'green',
  EXPENSE: 'red',
};

interface TrialBalanceRow {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  total_debit: number;
  total_credit: number;
}

export function TrialBalancePage() {
  const [asOfDate, setAsOfDate] = useState<dayjs.Dayjs | null>(null);
  const [data, setData] = useState<TrialBalanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const fetchTrialBalance = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (asOfDate) {
        params.as_of_date = asOfDate.format('YYYY-MM-DD');
      }
      const res = await glApi.getTrialBalance(params);
      setData(res.data.data);
    } catch {
      message.error(t('gl.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (v: number) => v.toLocaleString('zh-TW');

  const totalDebit = data.reduce((sum, row) => sum + Number(row.total_debit), 0);
  const totalCredit = data.reduce((sum, row) => sum + Number(row.total_credit), 0);

  const columns = [
    { title: t('gl.accountCode'), dataIndex: 'account_code', key: 'account_code', width: 120 },
    { title: t('gl.accountName'), dataIndex: 'account_name', key: 'account_name' },
    {
      title: t('gl.accountType'),
      dataIndex: 'account_type',
      key: 'account_type',
      width: 120,
      render: (v: string) => <Tag color={accountTypeColors[v] || 'default'}>{t(`gl.type_${v}`)}</Tag>,
    },
    {
      title: t('gl.totalDebit'),
      dataIndex: 'total_debit',
      key: 'total_debit',
      width: 150,
      align: 'right' as const,
      render: (v: number) => formatAmount(Number(v)),
    },
    {
      title: t('gl.totalCredit'),
      dataIndex: 'total_credit',
      key: 'total_credit',
      width: 150,
      align: 'right' as const,
      render: (v: number) => formatAmount(Number(v)),
    },
  ];

  return (
    <div>
      <Title level={3}>{t('gl.trialBalance')}</Title>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Text strong>{t('gl.asOfDate')}</Text>
          <DatePicker value={asOfDate} onChange={(v) => setAsOfDate(v)} />
          <Button type="primary" onClick={fetchTrialBalance}>{t('common.search')}</Button>
        </Space>
      </Card>

      {data.length > 0 && (
        <Card>
          <Table
            dataSource={data}
            columns={columns}
            rowKey="account_id"
            loading={loading}
            pagination={false}
            size="small"
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>{t('gl.total')}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong>{formatAmount(totalDebit)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text strong style={{ color: totalDebit === totalCredit ? '#389e0d' : '#cf1322' }}>
                      {formatAmount(totalCredit)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      )}
    </div>
  );
}
