import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Typography, message, Space, Input, Select, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '../../hooks/usePermission';
import { accountsApi } from '../../api/accounts.api';

const { Title } = Typography;

const typeColors: Record<string, string> = {
  ASSET: 'blue',
  LIABILITY: 'orange',
  EQUITY: 'purple',
  REVENUE: 'green',
  EXPENSE: 'red',
};

export function AccountListPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });
  const canWrite = usePermission('accounting.write');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchAccounts = async (page = 1, pageSize = 50) => {
    setLoading(true);
    try {
      const res = await accountsApi.list({ page, limit: pageSize, search: search || undefined, account_type: typeFilter });
      setAccounts(res.data.data);
      setPagination({ current: res.data.meta.page, pageSize: res.data.meta.limit, total: res.data.meta.total });
    } catch {
      message.error(t('accounts.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const columns = [
    { title: t('accounts.accountCode'), dataIndex: 'account_code', key: 'account_code', width: 120 },
    { title: t('accounts.accountName'), dataIndex: 'account_name', key: 'account_name' },
    {
      title: t('accounts.accountType'), dataIndex: 'account_type', key: 'account_type', width: 120,
      render: (type: string) => <Tag color={typeColors[type]}>{t(`accounts.type_${type}`)}</Tag>,
    },
    { title: t('accounts.level'), dataIndex: 'level', key: 'level', width: 80 },
    {
      title: t('accounts.parentAccount'), key: 'parent', width: 200,
      render: (_: any, record: any) => record.parent ? `${record.parent.account_code} ${record.parent.account_name}` : '-',
    },
    {
      title: t('common.status'), dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? t('common.active') : t('common.inactive')}</Tag>,
    },
    ...(canWrite ? [{
      title: t('common.actions'), key: 'actions', width: 80,
      render: (_: any, record: any) => <a onClick={() => navigate(`/accounts/${record.account_id}/edit`)}>{t('common.edit')}</a>,
    }] : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('accounts.title')}</Title>
        {canWrite && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/accounts/create')}>{t('common.create')}</Button>}
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder={t('accounts.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} onSearch={() => fetchAccounts()} style={{ width: 250 }} />
        <Select allowClear placeholder={t('accounts.accountType')} style={{ width: 150 }} value={typeFilter} onChange={(v) => setTypeFilter(v)} options={['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((t2) => ({ value: t2, label: t(`accounts.type_${t2}`) }))} />
        <Button onClick={() => fetchAccounts()}>{t('common.search')}</Button>
      </Space>
      <Table
        dataSource={accounts}
        columns={columns}
        rowKey="account_id"
        loading={loading}
        pagination={{ ...pagination, onChange: (p, ps) => fetchAccounts(p, ps) }}
        size="small"
      />
    </div>
  );
}
