import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Select, Tag, Space, Typography, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { deliveryRoutesApi } from '../../api/delivery-routes.api';
import { customersApi } from '../../api/customers.api';
import { usePermission } from '../../hooks/usePermission';

const { Title } = Typography;

interface Route {
  route_id: string;
  route_name: string;
  origin: string;
  content_type: string;
  standard_price: string | number;
  is_active: boolean;
  customer: {
    customer_id: string;
    customer_name: string;
    customer_code: string;
  };
}

interface CustomerOption {
  customer_id: string;
  customer_code: string;
  customer_name: string;
}

const contentTypeColors: Record<string, string> = {
  '熟食': 'orange',
  '麵包': 'blue',
  '其他': 'default',
};

export function RouteListPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string | undefined>();
  const [contentTypeFilter, setContentTypeFilter] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const navigate = useNavigate();
  const canWrite = usePermission('delivery.write');
  const { t } = useTranslation();

  useEffect(() => {
    customersApi
      .list({ limit: 200, status: 'ACTIVE' })
      .then((res) => setCustomers(res.data.data))
      .catch(() => {});
  }, []);

  const fetchRoutes = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (customerFilter) params.customer_id = customerFilter;
      if (contentTypeFilter) params.content_type = contentTypeFilter;
      if (search) params.search = search;
      const res = await deliveryRoutesApi.list(params);
      setRoutes(res.data.data);
      setPagination({
        current: res.data.meta.page,
        pageSize: res.data.meta.limit,
        total: res.data.meta.total,
      });
    } catch {
      message.error(t('delivery.loadRoutesFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString('zh-TW');

  const columns = [
    {
      title: t('delivery.routeName'),
      dataIndex: 'route_name',
      key: 'route_name',
    },
    {
      title: t('delivery.contentType'),
      dataIndex: 'content_type',
      key: 'content_type',
      width: 100,
      render: (v: string) => (
        <Tag color={contentTypeColors[v] || 'default'}>{v}</Tag>
      ),
    },
    {
      title: t('delivery.customer'),
      key: 'customer',
      render: (_: unknown, record: Route) => record.customer?.customer_name || '-',
    },
    {
      title: t('delivery.standardPrice'),
      dataIndex: 'standard_price',
      key: 'standard_price',
      align: 'right' as const,
      width: 120,
      render: (v: string | number) => formatAmount(v),
    },
    {
      title: t('common.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>
          {v ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    ...(canWrite
      ? [
          {
            title: t('common.actions'),
            key: 'actions',
            width: 80,
            render: (_: unknown, record: Route) => (
              <Button type="link" onClick={() => navigate(`/delivery-routes/${record.route_id}/edit`)}>
                {t('common.edit')}
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('delivery.routes')}</Title>
        {canWrite && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/delivery-routes/create')}>
            {t('delivery.createRoute')}
          </Button>
        )}
      </div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder={t('delivery.customerFilter')}
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 200 }}
          value={customerFilter}
          onChange={(v) => setCustomerFilter(v)}
          options={customers.map((c) => ({
            value: c.customer_id,
            label: `${c.customer_code} - ${c.customer_name}`,
          }))}
        />
        <Select
          placeholder={t('delivery.contentTypeFilter')}
          allowClear
          style={{ width: 140 }}
          value={contentTypeFilter}
          onChange={(v) => setContentTypeFilter(v)}
          options={[
            { value: '熟食', label: '熟食' },
            { value: '麵包', label: '麵包' },
            { value: '其他', label: '其他' },
          ]}
        />
        <Input
          placeholder={t('delivery.searchRoutePlaceholder')}
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => fetchRoutes(1)}
          style={{ width: 200 }}
          allowClear
        />
        <Button onClick={() => fetchRoutes(1)}>{t('common.search')}</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={routes}
        rowKey="route_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
          onChange: (page, pageSize) => fetchRoutes(page, pageSize),
        }}
      />
    </div>
  );
}
