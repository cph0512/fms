import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  Table,
  Typography,
  message,
  Space,
  Statistic,
  Divider,
  Row,
  Col,
  Tag,
  Spin,
} from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { deliveryTripsApi } from '../../api/delivery-trips.api';
import { customersApi } from '../../api/customers.api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface CustomerOption {
  customer_id: string;
  customer_code: string;
  customer_name: string;
}

interface TripPreview {
  trip_id: string;
  trip_date: string;
  trips_count: number;
  amount: string | number;
  driver_name: string | null;
  route: {
    route_name: string;
    content_type: string;
  };
}

const contentTypeColors: Record<string, string> = {
  '熟食': 'orange',
  '麵包': 'blue',
  '其他': 'default',
};

export function TripInvoicePage() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [trips, setTrips] = useState<TripPreview[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [customerId, setCustomerId] = useState<string | undefined>();
  const [fromDate, setFromDate] = useState<dayjs.Dayjs | null>(dayjs().startOf('month'));
  const [toDate, setToDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    customersApi
      .list({ limit: 200, status: 'ACTIVE' })
      .then((res) => setCustomers(res.data.data))
      .catch(() => {});
  }, []);

  const fetchTrips = async () => {
    if (!customerId || !fromDate || !toDate) return;
    setTripsLoading(true);
    try {
      const res = await deliveryTripsApi.list({
        customer_id: customerId,
        from_date: fromDate.format('YYYY-MM-DD'),
        to_date: toDate.format('YYYY-MM-DD'),
        status: 'CONFIRMED',
        limit: 500,
      });
      setTrips(res.data.data || []);
    } catch {
      message.error(t('delivery.loadTripsFailed'));
    } finally {
      setTripsLoading(false);
    }
  };

  useEffect(() => {
    if (customerId && fromDate && toDate) {
      fetchTrips();
    } else {
      setTrips([]);
    }
  }, [customerId, fromDate, toDate]);

  const formatAmount = (val: string | number) =>
    Number(val).toLocaleString('zh-TW');

  const subtotal = trips.reduce((sum, t) => sum + Number(t.amount), 0);
  const taxAmount = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + taxAmount;

  const handleGenerate = async () => {
    if (!customerId || !fromDate || !toDate) {
      message.warning(t('delivery.fillAllFields'));
      return;
    }
    if (trips.length === 0) {
      message.warning(t('delivery.noTripsToInvoice'));
      return;
    }
    setGenerating(true);
    try {
      const res = await deliveryTripsApi.generateInvoice({
        customer_id: customerId,
        from_date: fromDate.format('YYYY-MM-DD'),
        to_date: toDate.format('YYYY-MM-DD'),
        description: description || undefined,
        notes: notes || undefined,
      });
      message.success(t('delivery.invoiceGenerated'));
      const invoiceId = res.data.data?.invoice_id;
      if (invoiceId) {
        navigate(`/ar/invoices/${invoiceId}`);
      } else {
        navigate('/ar/invoices');
      }
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('delivery.invoiceGenerateFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const tripColumns = [
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
      render: (_: unknown, record: TripPreview) => record.route?.route_name || '-',
    },
    {
      title: t('delivery.contentType'),
      key: 'content_type',
      width: 100,
      render: (_: unknown, record: TripPreview) => {
        const ct = record.route?.content_type;
        return ct ? <Tag color={contentTypeColors[ct] || 'default'}>{ct}</Tag> : '-';
      },
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
      render: (v: string | number) => `$${formatAmount(v)}`,
    },
    {
      title: t('delivery.driverName'),
      dataIndex: 'driver_name',
      key: 'driver_name',
      width: 100,
      render: (v: string | null) => v || '-',
    },
  ];

  return (
    <div>
      <Title level={3}>{t('delivery.generateInvoice')}</Title>

      {/* Filter Form */}
      <Card style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label={t('delivery.customer')} required>
                <Select
                  showSearch
                  placeholder={t('delivery.selectCustomer')}
                  optionFilterProp="label"
                  value={customerId}
                  onChange={(v) => setCustomerId(v)}
                  options={customers.map((c) => ({
                    value: c.customer_id,
                    label: `${c.customer_code} - ${c.customer_name}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item label={t('delivery.fromDate')} required>
                <DatePicker
                  value={fromDate}
                  onChange={(d) => setFromDate(d)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Item label={t('delivery.toDate')} required>
                <DatePicker
                  value={toDate}
                  onChange={(d) => setToDate(d)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label={t('delivery.invoiceDescription')}>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('delivery.invoiceDescriptionPlaceholder')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item label={t('delivery.invoiceNotes')}>
                <Input.TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={t('delivery.invoiceNotesPlaceholder')}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Preview */}
      {tripsLoading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      )}

      {!tripsLoading && customerId && fromDate && toDate && (
        <>
          {/* Summary */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={24}>
              <Col xs={12} sm={6}>
                <Statistic
                  title={t('delivery.tripCount')}
                  value={trips.length}
                  suffix={t('delivery.tripUnit')}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title={t('delivery.subtotal')}
                  value={formatAmount(subtotal)}
                  prefix="$"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title={t('delivery.estimatedTax')}
                  value={formatAmount(taxAmount)}
                  prefix="$"
                  suffix="(5%)"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title={t('delivery.estimatedTotal')}
                  value={formatAmount(totalAmount)}
                  prefix="$"
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                />
              </Col>
            </Row>
          </Card>

          {/* Trips Table */}
          <Card
            title={t('delivery.includedTrips')}
            style={{ marginBottom: 16 }}
          >
            {trips.length === 0 ? (
              <Text type="secondary">{t('delivery.noConfirmedTrips')}</Text>
            ) : (
              <Table
                columns={tripColumns}
                dataSource={trips}
                rowKey="trip_id"
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>{t('delivery.subtotal')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">
                      <Text strong>
                        {trips.reduce((sum, t) => sum + t.trips_count, 0)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <Text strong>${formatAmount(subtotal)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} />
                  </Table.Summary.Row>
                )}
              />
            )}
          </Card>

          <Divider />
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<FileTextOutlined />}
              loading={generating}
              disabled={trips.length === 0}
              onClick={handleGenerate}
            >
              {t('delivery.generateInvoice')}
            </Button>
            <Button size="large" onClick={() => navigate('/delivery-trips')}>
              {t('common.cancel')}
            </Button>
          </Space>
        </>
      )}
    </div>
  );
}
