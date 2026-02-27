import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Tag, Space, Typography, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { customersApi } from '../../api/customers.api';
import { usePermission } from '../../hooks/usePermission';

const { Title } = Typography;

interface Customer {
  customer_id: string;
  customer_code: string;
  customer_name: string;
  short_name: string | null;
  tax_id: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  payment_terms: number;
  credit_limit: string;
  status: string;
}

export function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const navigate = useNavigate();
  const canWrite = usePermission('customer.write');
  const { t } = useTranslation();

  const fetchCustomers = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await customersApi.list({ page, limit: pageSize, search: search || undefined });
      setCustomers(res.data.data);
      setPagination({
        current: res.data.meta.page,
        pageSize: res.data.meta.limit,
        total: res.data.meta.total,
      });
    } catch {
      message.error(t('customers.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const columns = [
    { title: t('customers.customerCode'), dataIndex: 'customer_code', key: 'customer_code', width: 120 },
    { title: t('customers.customerName'), dataIndex: 'customer_name', key: 'customer_name' },
    { title: t('customers.shortName'), dataIndex: 'short_name', key: 'short_name', render: (v: string) => v || '-' },
    { title: t('customers.taxId'), dataIndex: 'tax_id', key: 'tax_id', render: (v: string) => v || '-' },
    { title: t('customers.contactPerson'), dataIndex: 'contact_person', key: 'contact_person', render: (v: string) => v || '-' },
    { title: t('common.phone'), dataIndex: 'phone', key: 'phone', render: (v: string) => v || '-' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>{status === 'ACTIVE' ? t('common.active') : t('common.inactive')}</Tag>
      ),
    },
    ...(canWrite
      ? [{
          title: t('common.actions'),
          key: 'actions',
          render: (_: unknown, record: Customer) => (
            <Button type="link" onClick={() => navigate(`/customers/${record.customer_id}/edit`)}>
              {t('common.edit')}
            </Button>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('customers.title')}</Title>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/customers/create')}>
            {t('customers.createCustomer')}
          </Button>
        )}
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder={t('customers.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => fetchCustomers(1)}
          style={{ width: 300 }}
          allowClear
        />
        <Button onClick={() => fetchCustomers(1)}>{t('common.search')}</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={customers}
        rowKey="customer_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
          onChange: (page, pageSize) => fetchCustomers(page, pageSize),
        }}
      />
    </div>
  );
}
