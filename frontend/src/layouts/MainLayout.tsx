import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Select, Button, Space, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BankOutlined,
  LogoutOutlined,
  KeyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { usePermission } from '../hooks/usePermission';
import { companiesApi } from '../api/companies.api';

const { Header, Sider, Content } = Layout;

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();

  const user = useAuthStore((s) => s.user);
  const currentCompany = useAuthStore((s) => s.currentCompany);
  const companies = useAuthStore((s) => s.companies);
  const logout = useAuthStore((s) => s.logout);
  const setCompanyData = useAuthStore((s) => s.setCompanyData);
  const canManageUsers = usePermission('user.manage');
  const canManageCompanies = usePermission('company.manage');

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

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    ...(canManageUsers
      ? [{ key: '/users', icon: <UserOutlined />, label: 'Users' }]
      : []),
    { key: '/companies', icon: <BankOutlined />, label: 'Companies' },
  ];

  const userMenuItems = [
    { key: 'name', label: user?.display_name, disabled: true },
    { type: 'divider' as const },
    { key: 'password', icon: <KeyOutlined />, label: 'Change Password' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 16 : 20, fontWeight: 'bold' }}>
          {collapsed ? 'FMS' : 'FMS System'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
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
