import { Card, Col, Row, Statistic, Typography } from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  ShopOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;

export function DashboardPage() {
  const currentCompany = useAuthStore((s) => s.currentCompany);

  return (
    <div>
      <Title level={3}>Dashboard</Title>
      <Text type="secondary">Welcome to {currentCompany?.company_name || 'FMS'}</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Accounts Receivable" value={0} prefix={<DollarOutlined />} suffix="TWD" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Accounts Payable" value={0} prefix={<DollarOutlined />} suffix="TWD" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Customers" value={0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Vendors" value={0} prefix={<ShopOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}><BankOutlined /> Company Information</Title>
        <Row gutter={16}>
          <Col span={8}><Text type="secondary">Company Name</Text><br />{currentCompany?.company_name}</Col>
          <Col span={8}><Text type="secondary">Tax ID</Text><br />{currentCompany?.tax_id || '-'}</Col>
          <Col span={8}><Text type="secondary">Currency</Text><br />{currentCompany?.default_currency}</Col>
        </Row>
      </Card>
    </div>
  );
}
