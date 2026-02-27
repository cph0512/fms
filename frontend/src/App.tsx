import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
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

function App() {
  return (
    <ConfigProvider locale={zhTW} theme={{ token: { colorPrimary: '#1677ff' } }}>
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
