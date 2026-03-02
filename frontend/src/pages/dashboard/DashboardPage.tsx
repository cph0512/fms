import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Table, Spin, Tag } from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  ShopOutlined,
  BankOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore } from '../../stores/authStore';
import { dashboardApi } from '../../api/dashboard.api';

const { Title, Text } = Typography;

interface DashboardData {
  customers: number;
  vendors: number;
  ar: { total: number; paid: number; outstanding: number; overdue_count: number; overdue_amount: number };
  ap: { total: number; paid: number; outstanding: number; overdue_count: number; overdue_amount: number };
  recent_ar_invoices: any[];
  recent_ap_bills: any[];
}

export function DashboardPage() {
  const currentCompany = useAuthStore((s) => s.currentCompany);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getSummary()
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const arColumns = [
    { title: t('ar.invoiceNumber'), dataIndex: 'invoice_number', key: 'invoice_number' },
    { title: t('ar.customer'), dataIndex: ['customer', 'customer_name'], key: 'customer' },
    { title: t('ar.totalAmount'), dataIndex: 'total_amount', key: 'total', render: (v: number) => fmt(Number(v)) },
    {
      title: t('common.status'), dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const color = s === 'PAID' ? 'green' : s === 'OVERDUE' ? 'red' : s === 'VOID' ? 'default' : 'blue';
        return <Tag color={color}>{s}</Tag>;
      },
    },
    { title: t('ar.dueDate'), dataIndex: 'due_date', key: 'due', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
  ];

  const apColumns = [
    { title: t('ap.billNumber'), dataIndex: 'bill_number', key: 'bill_number' },
    { title: t('ap.vendor'), dataIndex: ['vendor', 'vendor_name'], key: 'vendor' },
    { title: t('ap.totalAmount'), dataIndex: 'total_amount', key: 'total', render: (v: number) => fmt(Number(v)) },
    {
      title: t('common.status'), dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const color = s === 'PAID' ? 'green' : s === 'OVERDUE' ? 'red' : s === 'VOID' ? 'default' : 'blue';
        return <Tag color={color}>{s}</Tag>;
      },
    },
    { title: t('ap.dueDate'), dataIndex: 'due_date', key: 'due', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const d = data || { customers: 0, vendors: 0, ar: { total: 0, outstanding: 0, overdue_count: 0, overdue_amount: 0 }, ap: { total: 0, outstanding: 0, overdue_count: 0, overdue_amount: 0 }, recent_ar_invoices: [], recent_ap_bills: [] };

  return (
    <div>
      <Title level={3}>{t('dashboard.title')}</Title>
      <Text type="secondary">{t('dashboard.welcome', { name: currentCompany?.company_name || 'FMS' })}</Text>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/customers')}>
            <Statistic title={t('dashboard.customerCount')} value={d.customers} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/vendors')}>
            <Statistic title={t('dashboard.vendorCount')} value={d.vendors} prefix={<ShopOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/ar/invoices')}>
            <Statistic title={t('dashboard.arTotal')} value={fmt(d.ar.outstanding)} prefix={<DollarOutlined />} suffix={currentCompany?.default_currency} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/ap/bills')}>
            <Statistic title={t('dashboard.apTotal')} value={fmt(d.ap.outstanding)} prefix={<DollarOutlined />} suffix={currentCompany?.default_currency} />
          </Card>
        </Col>
      </Row>

      {/* Overdue Warnings */}
      {(d.ar.overdue_count > 0 || d.ap.overdue_count > 0) && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {d.ar.overdue_count > 0 && (
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title={t('dashboard.arOverdue')}
                  value={fmt(d.ar.overdue_amount)}
                  prefix={<WarningOutlined />}
                  suffix={currentCompany?.default_currency}
                  valueStyle={{ color: '#cf1322' }}
                />
                <Text type="secondary">{t('dashboard.overdueCount')}: {d.ar.overdue_count}</Text>
              </Card>
            </Col>
          )}
          {d.ap.overdue_count > 0 && (
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title={t('dashboard.apOverdue')}
                  value={fmt(d.ap.overdue_amount)}
                  prefix={<WarningOutlined />}
                  suffix={currentCompany?.default_currency}
                  valueStyle={{ color: '#cf1322' }}
                />
                <Text type="secondary">{t('dashboard.overdueCount')}: {d.ap.overdue_count}</Text>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Company Info */}
      <Card style={{ marginTop: 16 }}>
        <Title level={4}><BankOutlined /> {t('dashboard.companyInfo')}</Title>
        <Row gutter={16}>
          <Col span={8}><Text type="secondary">{t('dashboard.companyName')}</Text><br />{currentCompany?.company_name}</Col>
          <Col span={8}><Text type="secondary">{t('dashboard.taxId')}</Text><br />{currentCompany?.tax_id || '-'}</Col>
          <Col span={8}><Text type="secondary">{t('dashboard.currency')}</Text><br />{currentCompany?.default_currency}</Col>
        </Row>
      </Card>

      {/* Recent Transactions */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.recentArInvoices')}>
            <Table
              dataSource={d.recent_ar_invoices}
              columns={arColumns}
              rowKey="invoice_id"
              size="small"
              pagination={false}
              onRow={(record) => ({ onClick: () => navigate(`/ar/invoices/${record.invoice_id}`), style: { cursor: 'pointer' } })}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.recentApBills')}>
            <Table
              dataSource={d.recent_ap_bills}
              columns={apColumns}
              rowKey="bill_id"
              size="small"
              pagination={false}
              onRow={(record) => ({ onClick: () => navigate(`/ap/bills/${record.bill_id}`), style: { cursor: 'pointer' } })}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
