import { Card, Col, Row, Statistic, Typography } from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  ShopOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;

export function DashboardPage() {
  const currentCompany = useAuthStore((s) => s.currentCompany);
  const { t } = useTranslation();

  return (
    <div>
      <Title level={3}>{t('dashboard.title')}</Title>
      <Text type="secondary">{t('dashboard.welcome', { name: currentCompany?.company_name || 'FMS' })}</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={t('dashboard.accountsReceivable')} value={0} prefix={<DollarOutlined />} suffix="TWD" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={t('dashboard.accountsPayable')} value={0} prefix={<DollarOutlined />} suffix="TWD" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={t('dashboard.customers')} value={0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={t('dashboard.vendors')} value={0} prefix={<ShopOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}><BankOutlined /> {t('dashboard.companyInfo')}</Title>
        <Row gutter={16}>
          <Col span={8}><Text type="secondary">{t('dashboard.companyName')}</Text><br />{currentCompany?.company_name}</Col>
          <Col span={8}><Text type="secondary">{t('dashboard.taxId')}</Text><br />{currentCompany?.tax_id || '-'}</Col>
          <Col span={8}><Text type="secondary">{t('dashboard.currency')}</Text><br />{currentCompany?.default_currency}</Col>
        </Row>
      </Card>
    </div>
  );
}
