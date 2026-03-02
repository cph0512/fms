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
import { AccountListPage } from './pages/accounts/AccountListPage';
import { AccountCreatePage } from './pages/accounts/AccountCreatePage';
import { AccountEditPage } from './pages/accounts/AccountEditPage';
import { BankAccountListPage } from './pages/bank-accounts/BankAccountListPage';
import { BankAccountCreatePage } from './pages/bank-accounts/BankAccountCreatePage';
import { BankAccountEditPage } from './pages/bank-accounts/BankAccountEditPage';
import { JournalEntryListPage } from './pages/journal/JournalEntryListPage';
import { JournalEntryCreatePage } from './pages/journal/JournalEntryCreatePage';
import { JournalEntryDetailPage } from './pages/journal/JournalEntryDetailPage';
import { AccountLedgerPage } from './pages/gl/AccountLedgerPage';
import { TrialBalancePage } from './pages/gl/TrialBalancePage';
import { BalanceSheetPage } from './pages/reports/BalanceSheetPage';
import { IncomeStatementPage } from './pages/reports/IncomeStatementPage';
import { BudgetListPage } from './pages/budgets/BudgetListPage';
import { BudgetCreatePage } from './pages/budgets/BudgetCreatePage';
import { BudgetDetailPage } from './pages/budgets/BudgetDetailPage';

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

            {/* Chart of Accounts */}
            <Route path="/accounts" element={<PermissionRoute permission="accounting.read" />}>
              <Route index element={<AccountListPage />} />
              <Route
                path="create"
                element={
                  <PermissionRoute permission="accounting.write">
                    <AccountCreatePage />
                  </PermissionRoute>
                }
              />
              <Route
                path=":id/edit"
                element={
                  <PermissionRoute permission="accounting.write">
                    <AccountEditPage />
                  </PermissionRoute>
                }
              />
            </Route>

            {/* Bank Accounts */}
            <Route path="/bank-accounts" element={<PermissionRoute permission="bank.read" />}>
              <Route index element={<BankAccountListPage />} />
              <Route
                path="create"
                element={
                  <PermissionRoute permission="bank.write">
                    <BankAccountCreatePage />
                  </PermissionRoute>
                }
              />
              <Route
                path=":id/edit"
                element={
                  <PermissionRoute permission="bank.write">
                    <BankAccountEditPage />
                  </PermissionRoute>
                }
              />
            </Route>

            {/* Journal Entries */}
            <Route path="/journal/entries" element={<PermissionRoute permission="accounting.read" />}>
              <Route index element={<JournalEntryListPage />} />
              <Route
                path="create"
                element={
                  <PermissionRoute permission="accounting.write">
                    <JournalEntryCreatePage />
                  </PermissionRoute>
                }
              />
              <Route path=":id" element={<JournalEntryDetailPage />} />
            </Route>

            {/* General Ledger */}
            <Route path="/gl" element={<PermissionRoute permission="accounting.read" />}>
              <Route path="ledger" element={<AccountLedgerPage />} />
              <Route path="trial-balance" element={<TrialBalancePage />} />
            </Route>

            {/* Financial Reports */}
            <Route path="/reports" element={<PermissionRoute permission="accounting.read" />}>
              <Route path="balance-sheet" element={<BalanceSheetPage />} />
              <Route path="income-statement" element={<IncomeStatementPage />} />
            </Route>

            {/* Budgets */}
            <Route path="/budgets" element={<PermissionRoute permission="budget.read" />}>
              <Route index element={<BudgetListPage />} />
              <Route
                path="create"
                element={
                  <PermissionRoute permission="budget.write">
                    <BudgetCreatePage />
                  </PermissionRoute>
                }
              />
              <Route path=":id" element={<BudgetDetailPage />} />
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
