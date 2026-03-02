import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Select, Tag, Space, Typography, message, DatePicker, Popconfirm } from 'antd';
import { PlusOutlined, ImportOutlined, FileTextOutlined, CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { deliveryTripsApi } from '../../api/delivery-trips.api';
import { customersApi } from '../../api/customers.api';
import { usePermission } from '../../hooks/usePermission';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface Trip {
  trip_id: string;
  trip_date: string;
  trips_count: number;
  amount: string | number;
  driver_name: string | null;
  vehicle_no: string | null;
  status: string;
  route: {
    route_id: string;
    route_name: string;
    content_type: string;
    customer: {
      customer_id: string;
      customer_name: string;
    };
  };
}

interface CustomerOption {
  customer_id: string;
  customer_code: string;
  customer_name: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  CONFIRMED: 'blue',
  BILLED: 'green',
  VOID: 'default',
};

const contentTypeColors: Record<string, string> = {
  '熟食': 'orange',
  '麵包': 'blue',
  '其他': 'default',
};

export function TripListPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const navigate = useNavigate();
  const canWrite = usePermission('delivery.write');
  const { t } = useTranslation();

  const statusLabelMap: Record<string, string> = {
    PENDING: t('delivery.pending'),
    CONFIRMED: t('delivery.confirmed'),
    BILLED: t('delivery.billed'),
    VOID: t('delivery.void'),
  };

  useEffect(() => {
    customersApi
      .list({ limit: 200, status: 'ACTIVE' })
      .then((res) => setCustomers(res.data.data))
      .catch(() => {});
  }, []);

  const fetchTrips = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (customerFilter) params.customer_id = customerFilter;
      if (statusFilter) params.status = statusFilter;
      if (dateRange) {
        params.from_date = dateRange[0].format('YYYY-MM-DD');
        params.to_date = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await deliveryTripsApi.list(params);
      setTrips(res.data.data);
      setPagination({
        current: res.data.meta.page,
        pageSize: res.data.meta.limit,
        total: res.data.meta.total,
      });
    } catch {
      message.error(t('delivery.loadTripsFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleConfirmSelected = async () => {
    if (selectedRowKeys.length === 0) return;
    setConfirmLoading(true);
    try {
      await deliveryTripsApi.confirm(selectedRowKeys);
      message.success(t('delivery.confirmSuccess', { count: selectedRowKeys.length }));
      setSelectedRowKeys([]);
      fetchTrips(pagination.current, pagination.pageSize);
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('delivery.confirmFailed'));
    } finally {
      setConfirmLoading(false);
    }
  };

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString('zh-TW');

  const columns = [
    {
      title: t('delivery.tripDate'),
      dataIndex: 'trip_date',
      key: 'trip_date',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: t('delivery.routeName'),
      key: 'route_name',
      render: (_: unknown, record: Trip) => record.route?.route_name || '-',
    },
    {
      title: t('delivery.contentType'),
      key: 'content_type',
      width: 100,
      render: (_: unknown, record: Trip) => {
        const ct = record.route?.content_type;
        return ct ? <Tag color={contentTypeColors[ct] || 'default'}>{ct}</Tag> : '-';
      },
    },
    {
      title: t('delivery.customer'),
      key: 'customer',
      render: (_: unknown, record: Trip) => record.route?.customer?.customer_name || '-',
    },
    {
      title: t('delivery.tripsCount'),
      dataIndex: 'trips_count',
      key: 'trips_count',
      width: 80,
      align: 'center' as const,
    },
    {
      title: t('delivery.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      width: 120,
      render: (v: string | number) => formatAmount(v),
    },
    {
      title: t('delivery.driverName'),
      dataIndex: 'driver_name',
      key: 'driver_name',
      width: 100,
      render: (v: string | null) => v || '-',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabelMap[status] || status}
        </Tag>
      ),
    },
    ...(canWrite
      ? [
          {
            title: t('common.actions'),
            key: 'actions',
            width: 80,
            render: (_: unknown, record: Trip) => (
              <Space>
                {record.status === 'PENDING' && (
                  <Popconfirm
                    title={t('delivery.voidConfirm')}
                    onConfirm={async () => {
                      try {
                        await deliveryTripsApi.void(record.trip_id);
                        message.success(t('delivery.voidSuccess'));
                        fetchTrips(pagination.current, pagination.pageSize);
                      } catch {
                        message.error(t('delivery.voidFailed'));
                      }
                    }}
                  >
                    <Button type="link" danger size="small">
                      {t('delivery.void')}
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  const rowSelection = canWrite
    ? {
        selectedRowKeys,
        onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
        getCheckboxProps: (record: Trip) => ({
          disabled: record.status !== 'PENDING',
        }),
      }
    : undefined;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('delivery.trips')}</Title>
        {canWrite && (
          <Space>
            <Button icon={<ImportOutlined />} onClick={() => navigate('/delivery-trips/import')}>
              {t('delivery.importTrips')}
            </Button>
            <Button icon={<FileTextOutlined />} onClick={() => navigate('/delivery-trips/invoice')}>
              {t('delivery.generateInvoice')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/delivery-trips/entry')}>
              {t('delivery.newEntry')}
            </Button>
          </Space>
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
          placeholder={t('delivery.statusFilter')}
          allowClear
          style={{ width: 140 }}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: 'PENDING', label: t('delivery.pending') },
            { value: 'CONFIRMED', label: t('delivery.confirmed') },
            { value: 'BILLED', label: t('delivery.billed') },
            { value: 'VOID', label: t('delivery.void') },
          ]}
        />
        <RangePicker
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        />
        <Button onClick={() => fetchTrips(1)}>{t('common.search')}</Button>
      </Space>
      {canWrite && selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>{t('delivery.selectedCount', { count: selectedRowKeys.length })}</span>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={confirmLoading}
              onClick={handleConfirmSelected}
            >
              {t('delivery.confirmSelected')}
            </Button>
          </Space>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={trips}
        rowKey="trip_id"
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
          onChange: (page, pageSize) => fetchTrips(page, pageSize),
        }}
      />
    </div>
  );
}
