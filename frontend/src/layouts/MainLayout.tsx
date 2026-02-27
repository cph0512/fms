import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Select, Button, Space, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BankOutlined,
  TeamOutlined,
  DollarOutlined,
  ShopOutlined,
  AccountBookOutlined,
  LogoutOutlined,
  KeyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { usePermission } from '../hooks/usePermission';
import { companiesApi } from '../api/companies.api';

const { Header, Sider, Content } = Layout;

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();
  const { t, i18n } = useTranslation();

  const user = useAuthStore((s) => s.user);
  const currentCompany = useAuthStore((s) => s.currentCompany);
  const companies = useAuthStore((s) => s.companies);
  const logout = useAuthStore((s) => s.logout);
  const setCompanyData = useAuthStore((s) => s.setCompanyData);
  const canManageUsers = usePermission('user.manage');
  const canReadCustomers = usePermission('customer.read');
  const canReadAR = usePermission('ar.read');
  const canReadVendors = usePermission('vendor.read');
  const canReadAP = usePermission('ap.read');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCompanySwitch = async (companyId: string) => {
    try {
      const res = await companiesApi.switch(companyId);
      const { accessToken, company, permissions } = res.data.data;
      setCompanyData(company, accessToken, permissions);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to switch company:', error);
    }
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'zh-TW' ? 'en' : 'zh-TW';
    i18n.changeLanguage(next);
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: t('menu.dashboard') },
    ...(canReadCustomers
      ? [{ key: '/customers', icon: <TeamOutlined />, label: t('menu.customers') }]
      : []),
    ...(canReadAR
      ? [{ key: '/ar/invoices', icon: <DollarOutlined />, label: t('menu.ar') }]
      : []),
    ...(canReadVendors
      ? [{ key: '/vendors', icon: <ShopOutlined />, label: t('menu.vendors') }]
      : []),
    ...(canReadAP
      ? [{ key: '/ap/bills', icon: <AccountBookOutlined />, label: t('menu.ap') }]
      : []),
    ...(canManageUsers
      ? [{ key: '/users', icon: <UserOutlined />, label: t('menu.users') }]
      : []),
    { key: '/companies', icon: <BankOutlined />, label: t('menu.companies') },
  ];

  const userMenuItems = [
    { key: 'name', label: user?.display_name, disabled: true },
    { type: 'divider' as const },
    { key: 'password', icon: <KeyOutlined />, label: t('menu.changePassword') },
    { key: 'logout', icon: <LogoutOutlined />, label: t('menu.logout'), danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 16 : 20, fontWeight: 'bold' }}>
          {collapsed ? t('menu.fms') : t('menu.fmsSystem')}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[
            menuItems.find((item) => location.pathname.startsWith(item.key))?.key || location.pathname,
          ]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: themeToken.colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Space size="middle">
            {companies.length > 1 && (
              <Select
                value={currentCompany?.company_id}
                onChange={handleCompanySwitch}
                style={{ minWidth: 200 }}
                suffixIcon={<SwapOutlined />}
                options={companies.map((c) => ({
                  value: c.company_id,
                  label: c.short_name || c.company_name,
                }))}
              />
            )}
            {companies.length === 1 && (
              <span style={{ color: themeToken.colorTextSecondary }}>
                {currentCompany?.short_name || currentCompany?.company_name}
              </span>
            )}
            <Button
              type="text"
              icon={<GlobalOutlined />}
              onClick={toggleLanguage}
            >
              {i18n.language === 'zh-TW' ? 'EN' : '中文'}
            </Button>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') handleLogout();
                  if (key === 'password') navigate('/change-password');
                },
              }}
              trigger={['click']}
            >
              <Button icon={<UserOutlined />}>
                {user?.display_name}
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: themeToken.colorBgContainer, borderRadius: themeToken.borderRadiusLG, minHeight: 360 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
