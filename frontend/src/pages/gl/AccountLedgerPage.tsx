import { useState, useEffect } from 'react';
import { Card, Table, Select, DatePicker, Button, Typography, message, Space, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { glApi } from '../../api/gl.api';
import { accountsApi } from '../../api/accounts.api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export function AccountLedgerPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    accountsApi.list({ limit: 500 }).then((res) => setAccounts(res.data.data)).catch(() => {});
  }, []);

  const fetchLedger = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange) {
        params.from_date = dateRange[0].format('YYYY-MM-DD');
        params.to_date = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await glApi.getAccountLedger(selectedAccount, params);
      setLedger(res.data.data);
    } catch {
      message.error(t('gl.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: t('gl.date'), dataIndex: ['entry', 'entry_date'], key: 'date', width: 120, render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    { title: t('gl.entryNumber'), dataIndex: ['entry', 'entry_number'], key: 'entry_number', width: 150 },
    { title: t('gl.description'), dataIndex: ['entry', 'description'], key: 'desc' },
    { title: t('gl.debit'), dataIndex: 'debit_amount', key: 'debit', width: 130, align: 'right' as const, render: (v: number) => v > 0 ? v.toLocaleString('zh-TW') : '' },
    { title: t('gl.credit'), dataIndex: 'credit_amount', key: 'credit', width: 130, align: 'right' as const, render: (v: number) => v > 0 ? v.toLocaleString('zh-TW') : '' },
    { title: t('gl.balance'), dataIndex: 'balance', key: 'balance', width: 130, align: 'right' as const, render: (v: number) => v.toLocaleString('zh-TW') },
  ];

  return (
    <div>
      <Title level={3}>{t('gl.accountLedger')}</Title>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="bottom">
          <Col span={8}>
            <Text strong>{t('gl.selectAccount')}</Text>
            <Select showSearch optionFilterProp="label" style={{ width: '100%', marginTop: 8 }} value={selectedAccount} onChange={setSelectedAccount}
              options={accounts.map((a: any) => ({ value: a.account_id, label: `${a.account_code} ${a.account_name}` }))} />
          </Col>
          <Col span={8}>
            <Text strong>{t('gl.dateRange')}</Text>
            <RangePicker style={{ width: '100%', marginTop: 8 }} value={dateRange} onChange={(v) => setDateRange(v as any)} />
          </Col>
          <Col span={4}>
            <Button type="primary" onClick={fetchLedger} disabled={!selectedAccount}>{t('common.search')}</Button>
          </Col>
        </Row>
      </Card>

      {ledger && (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Text strong>{t('gl.openingBalance')}: {ledger.opening_balance.toLocaleString('zh-TW')}</Text>
            <Text strong>{t('gl.closingBalance')}: {ledger.closing_balance.toLocaleString('zh-TW')}</Text>
          </Space>
          <Table dataSource={ledger.lines} columns={columns} rowKey="line_id" loading={loading} pagination={false} size="small" />
        </Card>
      )}
    </div>
  );
}
