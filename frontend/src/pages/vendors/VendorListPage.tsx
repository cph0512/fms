import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Tag, Space, Typography, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { vendorsApi } from '../../api/vendors.api';
import { usePermission } from '../../hooks/usePermission';

const { Title } = Typography;

interface Vendor {
  vendor_id: string;
  vendor_code: string;
  vendor_name: string;
  short_name: string | null;
  tax_id: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  payment_terms: number;
  credit_limit: string;
  status: string;
}

export function VendorListPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const navigate = useNavigate();
  const canWrite = usePermission('vendor.write');
  const { t } = useTranslation();

  const fetchVendors = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await vendorsApi.list({ page, limit: pageSize, search: search || undefined });
      setVendors(res.data.data);
      setPagination({
        current: res.data.meta.page,
        pageSize: res.data.meta.limit,
        total: res.data.meta.total,
      });
    } catch {
      message.error(t('vendors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const columns = [
    { title: t('vendors.vendorCode'), dataIndex: 'vendor_code', key: 'vendor_code', width: 120 },
    { title: t('vendors.vendorName'), dataIndex: 'vendor_name', key: 'vendor_name' },
    { title: t('vendors.shortName'), dataIndex: 'short_name', key: 'short_name', render: (v: string) => v || '-' },
    { title: t('vendors.taxId'), dataIndex: 'tax_id', key: 'tax_id', render: (v: string) => v || '-' },
    { title: t('vendors.contactPerson'), dataIndex: 'contact_person', key: 'contact_person', render: (v: string) => v || '-' },
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
          render: (_: unknown, record: Vendor) => (
            <Button type="link" onClick={() => navigate(`/vendors/${record.vendor_id}/edit`)}>
              {t('common.edit')}
            </Button>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('vendors.title')}</Title>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/vendors/create')}>
            {t('vendors.createVendor')}
          </Button>
        )}
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder={t('vendors.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => fetchVendors(1)}
          style={{ width: 300 }}
          allowClear
        />
        <Button onClick={() => fetchVendors(1)}>{t('common.search')}</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={vendors}
        rowKey="vendor_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
          onChange: (page, pageSize) => fetchVendors(page, pageSize),
        }}
      />
    </div>
  );
}
