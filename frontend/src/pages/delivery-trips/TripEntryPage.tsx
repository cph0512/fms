import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Button,
  Checkbox,
  Typography,
  message,
  Spin,
  Row,
  Col,
  Divider,
  Tag,
} from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { deliveryRoutesApi } from '../../api/delivery-routes.api';
import { deliveryTripsApi } from '../../api/delivery-trips.api';
import { customersApi } from '../../api/customers.api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface CustomerOption {
  customer_id: string;
  customer_code: string;
  customer_name: string;
}

interface Route {
  route_id: string;
  route_name: string;
  origin: string;
  content_type: string;
  standard_price: number | string;
  is_active: boolean;
}

interface SelectedRoute {
  route_id: string;
  trips_count: number;
  amount: number;
}

const contentTypeColors: Record<string, string> = {
  '熟食': 'orange',
  '麵包': 'blue',
  '其他': 'default',
};

export function TripEntryPage() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [tripDate, setTripDate] = useState(dayjs());
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');

  const [selectedRoutes, setSelectedRoutes] = useState<Map<string, SelectedRoute>>(new Map());

  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    customersApi
      .list({ limit: 200, status: 'ACTIVE' })
      .then((res) => setCustomers(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!customerId) {
      setRoutes([]);
      setSelectedRoutes(new Map());
      return;
    }
    setRoutesLoading(true);
    deliveryRoutesApi
      .getByCustomer(customerId)
      .then((res) => {
        const data = res.data.data || [];
        setRoutes(data.filter((r: Route) => r.is_active));
        setSelectedRoutes(new Map());
      })
      .catch(() => message.error(t('delivery.loadRoutesFailed')))
      .finally(() => setRoutesLoading(false));
  }, [customerId]);

  const groupedRoutes = useMemo(() => {
    const groups: Record<string, Route[]> = {};
    routes.forEach((route) => {
      const key = route.content_type || '其他';
      if (!groups[key]) groups[key] = [];
      groups[key].push(route);
    });
    return groups;
  }, [routes]);

  const handleToggleRoute = (route: Route, checked: boolean) => {
    const newMap = new Map(selectedRoutes);
    if (checked) {
      const price = Number(route.standard_price);
      newMap.set(route.route_id, {
        route_id: route.route_id,
        trips_count: 1,
        amount: price,
      });
    } else {
      newMap.delete(route.route_id);
    }
    setSelectedRoutes(newMap);
  };

  const handleTripsCountChange = (routeId: string, count: number | null, standardPrice: number) => {
    const c = count || 1;
    const newMap = new Map(selectedRoutes);
    const existing = newMap.get(routeId);
    if (existing) {
      newMap.set(routeId, {
        ...existing,
        trips_count: c,
        amount: c * standardPrice,
      });
      setSelectedRoutes(newMap);
    }
  };

  const totalSelected = selectedRoutes.size;
  const totalAmount = useMemo(() => {
    let sum = 0;
    selectedRoutes.forEach((s) => {
      sum += s.amount;
    });
    return sum;
  }, [selectedRoutes]);

  const formatAmount = (val: number | string) =>
    Number(val).toLocaleString('zh-TW');

  const handleSubmit = async () => {
    if (!customerId) {
      message.warning(t('delivery.selectCustomerFirst'));
      return;
    }
    if (selectedRoutes.size === 0) {
      message.warning(t('delivery.selectAtLeastOneRoute'));
      return;
    }
    setSubmitting(true);
    try {
      const trips = Array.from(selectedRoutes.values()).map((s) => ({
        route_id: s.route_id,
        trips_count: s.trips_count,
        amount: s.amount,
      }));
      await deliveryTripsApi.batchCreate({
        trip_date: tripDate.format('YYYY-MM-DD'),
        driver_name: driverName || undefined,
        vehicle_no: vehicleNo || undefined,
        trips,
      });
      message.success(t('delivery.entrySuccess'));
      navigate('/delivery-trips');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('delivery.entryFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <Title level={3}>{t('delivery.newEntry')}</Title>

      {/* Header form */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 4 }}>
              <Text strong>{t('delivery.tripDate')}</Text>
            </div>
            <DatePicker
              value={tripDate}
              onChange={(d) => d && setTripDate(d)}
              style={{ width: '100%', fontSize: 16 }}
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 4 }}>
              <Text strong>{t('delivery.customer')}</Text>
            </div>
            <Select
              showSearch
              placeholder={t('delivery.selectCustomer')}
              optionFilterProp="label"
              value={customerId}
              onChange={(v) => setCustomerId(v)}
              style={{ width: '100%', fontSize: 16 }}
              size="large"
              options={customers.map((c) => ({
                value: c.customer_id,
                label: `${c.customer_code} - ${c.customer_name}`,
              }))}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <div style={{ marginBottom: 4 }}>
              <Text strong>{t('delivery.driverName')}</Text>
            </div>
            <Input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder={t('delivery.driverNamePlaceholder')}
              style={{ fontSize: 16 }}
              size="large"
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <div style={{ marginBottom: 4 }}>
              <Text strong>{t('delivery.vehicleNo')}</Text>
            </div>
            <Input
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder={t('delivery.vehicleNoPlaceholder')}
              style={{ fontSize: 16 }}
              size="large"
            />
          </Col>
        </Row>
      </Card>

      {/* Routes by content type */}
      {routesLoading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      )}

      {!routesLoading && customerId && routes.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            {t('delivery.noRoutesForCustomer')}
          </div>
        </Card>
      )}

      {!routesLoading &&
        Object.entries(groupedRoutes).map(([contentType, groupRoutes]) => (
          <div key={contentType} style={{ marginBottom: 16 }}>
            <Divider titlePlacement="left">
              <Tag color={contentTypeColors[contentType] || 'default'} style={{ fontSize: 14, padding: '2px 12px' }}>
                {contentType}
              </Tag>
              <Text type="secondary" style={{ fontSize: 13 }}>
                ({groupRoutes.length} {t('delivery.routeCountUnit')})
              </Text>
            </Divider>

            {groupRoutes.map((route) => {
              const isSelected = selectedRoutes.has(route.route_id);
              const selected = selectedRoutes.get(route.route_id);
              const price = Number(route.standard_price);

              return (
                <Card
                  key={route.route_id}
                  size="small"
                  style={{
                    marginBottom: 8,
                    borderColor: isSelected ? '#1890ff' : undefined,
                    backgroundColor: isSelected ? '#f0f7ff' : undefined,
                    cursor: 'pointer',
                  }}
                  bodyStyle={{ padding: '12px 16px' }}
                  onClick={() => {
                    if (!isSelected) {
                      handleToggleRoute(route, true);
                    }
                  }}
                >
                  <Row align="middle" gutter={[12, 8]}>
                    <Col flex="none">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => handleToggleRoute(route, e.target.checked)}
                        style={{ transform: 'scale(1.3)' }}
                      />
                    </Col>
                    <Col flex="auto">
                      <Text strong style={{ fontSize: 15 }}>
                        {route.route_name}
                      </Text>
                    </Col>
                    <Col flex="none">
                      <Text style={{ fontSize: 15, color: '#1890ff' }}>
                        ${formatAmount(price)}
                      </Text>
                    </Col>
                  </Row>

                  {isSelected && (
                    <Row align="middle" gutter={[12, 0]} style={{ marginTop: 8 }}>
                      <Col flex="none" style={{ paddingLeft: 32 }}>
                        <Text type="secondary">{t('delivery.tripsCount')}:</Text>
                      </Col>
                      <Col flex="none">
                        <InputNumber
                          min={1}
                          max={99}
                          value={selected?.trips_count || 1}
                          onChange={(val) => handleTripsCountChange(route.route_id, val, price)}
                          size="large"
                          style={{ width: 80, fontSize: 16 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Col>
                      <Col flex="auto" style={{ textAlign: 'right' }}>
                        <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                          ${formatAmount(selected?.amount || price)}
                        </Text>
                      </Col>
                    </Row>
                  )}
                </Card>
              );
            })}
          </div>
        ))}

      {/* Sticky bottom bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderTop: '1px solid #e8e8e8',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <div>
          <Text style={{ fontSize: 15 }}>
            {t('delivery.selectedSummary', { count: totalSelected })}
          </Text>
          <Text strong style={{ fontSize: 18, marginLeft: 12, color: '#1890ff' }}>
            ${formatAmount(totalAmount)}
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          loading={submitting}
          disabled={selectedRoutes.size === 0}
          onClick={handleSubmit}
          style={{ minWidth: 120, height: 48, fontSize: 16 }}
        >
          {t('delivery.submit')}
        </Button>
      </div>
    </div>
  );
}
