import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Tag, Space, Typography, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { bankAccountsApi } from '../../api/bank-accounts.api';
import { usePermission } from '../../hooks/usePermission';

const { Title } = Typography;

interface BankAccount {
  bank_account_id: string;
  account_name: string;
  bank_name: string;
  branch_name: string | null;
  account_number: string;
  currency: string;
  current_balance: string;
  is_active: boolean;
}

export function BankAccountListPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const navigate = useNavigate();
  const canWrite = usePermission('bank_account.write');
  const { t } = useTranslation();

  const fetchAccounts = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await bankAccountsApi.list({ page, limit: pageSize, search: search || undefined });
      setAccounts(res.data.data);
      setPagination({
        current: res.data.meta.page,
        pageSize: res.data.meta.limit,
        total: res.data.meta.total,
      });
    } catch {
      message.error(t('bankAccounts.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString('zh-TW', { minimumFractionDigits: 0 });

  const columns = [
    { title: t('bankAccounts.accountName'), dataIndex: 'account_name', key: 'account_name' },
    { title: t('bankAccounts.bankName'), dataIndex: 'bank_name', key: 'bank_name' },
    { title: t('bankAccounts.branchName'), dataIndex: 'branch_name', key: 'branch_name', render: (v: string) => v || '-' },
    { title: t('bankAccounts.accountNumber'), dataIndex: 'account_number', key: 'account_number' },
    { title: t('bankAccounts.currency'), dataIndex: 'currency', key: 'currency', width: 80 },
    {
      title: t('bankAccounts.currentBalance'),
      dataIndex: 'current_balance',
      key: 'current_balance',
      align: 'right' as const,
      render: (v: string) => formatAmount(v),
    },
    {
      title: t('common.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>{v ? t('common.active') : t('common.inactive')}</Tag>
      ),
    },
    ...(canWrite
      ? [{
          title: t('common.actions'),
          key: 'actions',
          render: (_: unknown, record: BankAccount) => (
            <Button type="link" onClick={() => navigate(`/bank-accounts/${record.bank_account_id}/edit`)}>
              {t('common.edit')}
            </Button>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('bankAccounts.title')}</Title>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/bank-accounts/create')}>
            {t('bankAccounts.createAccount')}
          </Button>
        )}
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder={t('bankAccounts.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => fetchAccounts(1)}
          style={{ width: 300 }}
          allowClear
        />
        <Button onClick={() => fetchAccounts(1)}>{t('common.search')}</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={accounts}
        rowKey="bank_account_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
          onChange: (page, pageSize) => fetchAccounts(page, pageSize),
        }}
      />
    </div>
  );
}
