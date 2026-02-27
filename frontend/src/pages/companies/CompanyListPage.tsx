import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { companiesApi } from '../../api/companies.api';
import { usePermission } from '../../hooks/usePermission';

const { Title } = Typography;

interface Company {
  company_id: string;
  company_name: string;
  short_name: string | null;
  tax_id: string | null;
  phone: string | null;
  default_currency: string;
  status: string;
  is_default: boolean;
}

export function CompanyListPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const canManage = usePermission('company.manage');
  const { t } = useTranslation();

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await companiesApi.list();
      setCompanies(res.data.data);
    } catch {
      message.error(t('companies.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const columns = [
    { title: t('companies.companyName'), dataIndex: 'company_name', key: 'company_name' },
    { title: t('companies.shortName'), dataIndex: 'short_name', key: 'short_name' },
    { title: t('companies.taxId'), dataIndex: 'tax_id', key: 'tax_id', render: (v: string) => v || '-' },
    { title: t('dashboard.currency'), dataIndex: 'default_currency', key: 'default_currency' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: t('common.default'),
      dataIndex: 'is_default',
      key: 'is_default',
      render: (v: boolean) => v ? <Tag color="blue">{t('common.default')}</Tag> : null,
    },
    ...(canManage
      ? [{
          title: t('common.actions'),
          key: 'actions',
          render: (_: unknown, record: Company) => (
            <Button type="link" onClick={() => navigate(`/companies/${record.company_id}/edit`)}>
              {t('common.edit')}
            </Button>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('companies.title')}</Title>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/companies/create')}>
            {t('companies.createCompany')}
          </Button>
        )}
      </div>
      <Table
        columns={columns}
        dataSource={companies}
        rowKey="company_id"
        loading={loading}
        pagination={false}
      />
    </div>
  );
}
