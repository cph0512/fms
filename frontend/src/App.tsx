import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import { PrivateRoute } from './routes/PrivateRoute';
import { PermissionRoute } from './routes/PermissionRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { UserListPage } from './pages/users/UserListPage';
import { UserCreatePage } from './pages/users/UserCreatePage';
import { UserEditPage } from './pages/users/UserEditPage';
import { CompanyListPage } from './pages/companies/CompanyListPage';
import { CompanyCreatePage } from './pages/companies/CompanyCreatePage';
import { CompanyEditPage } from './pages/companies/CompanyEditPage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { CustomerCreatePage } from './pages/customers/CustomerCreatePage';
import { CustomerEditPage } from './pages/customers/CustomerEditPage';
import { ArInvoiceListPage } from './pages/ar/ArInvoiceListPage';
import { ArInvoiceCreatePage } from './pages/ar/ArInvoiceCreatePage';
import { ArInvoiceDetailPage } from './pages/ar/ArInvoiceDetailPage';
import { VendorListPage } from './pages/vendors/VendorListPage';
import { VendorCreatePage } from './pages/vendors/VendorCreatePage';
import { VendorEditPage } from './pages/vendors/VendorEditPage';
import { ApBillListPage } from './pages/ap/ApBillListPage';
import { ApBillCreatePage } from './pages/ap/ApBillCreatePage';
import { ApBillDetailPage } from './pages/ap/ApBillDetailPage';

const antdLocales: Record<string, typeof zhTW> = {
  'zh-TW': zhTW,
  en: enUS,
};

function App() {
  const { i18n } = useTranslation();
  const antdLocale = antdLocales[i18n.language] || zhTW;

  return (
    <ConfigProvider locale={antdLocale} theme={{ token: { colorPrimary: '#1677ff' } }}>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected routes */}
          <Route
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />

            {/* User Management - requires user.manage permission */}
            <Route path="/users" element={<PermissionRoute permission="user.manage" />}>
              <Route index element={<UserListPage />} />
              <Route path="create" element={<UserCreatePage />} />
              <Route path=":id/edit" element={<UserEditPage />} />
            </Route>

            {/* Customer Management */}
            <Route path="/customers" element={<PermissionRoute permission="customer.read" />}>
              <Route index element={<CustomerListPage />} />
              <Route
                path="create"
                element={
                  <PermissionRoute permission="customer.write">
                    <CustomerCreatePage />
                  </PermissionRoute>
                }
              />
              <Route
                path=":id/edit"
                element={
                  <PermissionRoute permission="customer.write">
                    <CustomerEditPage />
                  </PermissionRoute>
                }
              />
            </Route>

            {/* Accounts Receivable */}
            <Route path="/ar/invoices" element={<PermissionRoute permission="ar.read" />}>
              <Route index element={<ArInvoiceListPage />} />
              <Route
                path="create"
                element={
                  <PermissionRoute permission="ar.write">
                    <ArInvoiceCreatePage />
                  </PermissionRoute>
                }
              />
              <Route path=":id" element={<ArInvoiceDetailPage />} />
            </Route>

            {/* Vendor Management */}
            <Route path="/vendors" element={<PermissionRoute permission="vendor.read" />}>
              <Route index element={<VendorListPage />} />
              <Route
                path="create"
                element={
                  <PermissionRoute permission="vendor.write">
                    <VendorCreatePage />
                  </PermissionRoute>
                }
              />
              <Route
                path=":id/edit"
                element={
                  <PermissionRoute permission="vendor.write">
                    <VendorEditPage />
                  </PermissionRoute>
                }
              />
            </Route>

            {/* Accounts Payable */}
            <Route path="/ap/bills" element={<PermissionRoute permission="ap.read" />}>
              <Route index element={<ApBillListPage />} />
              <Route
                path="create"
                element={
                  <PermissionRoute permission="ap.write">
                    <ApBillCreatePage />
                  </PermissionRoute>
                }
              />
              <Route path=":id" element={<ApBillDetailPage />} />
            </Route>

            {/* Company Management */}
            <Route path="/companies">
              <Route index element={<CompanyListPage />} />
              <Route
                path="create"
                element={
                  <PermissionRoute permission="company.manage">
                    <CompanyCreatePage />
                  </PermissionRoute>
                }
              />
              <Route
                path=":id/edit"
                element={
                  <PermissionRoute permission="company.manage">
                    <CompanyEditPage />
                  </PermissionRoute>
                }
              />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
