import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
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

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await companiesApi.list();
      setCompanies(res.data.data);
    } catch {
      message.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const columns = [
    { title: 'Company Name', dataIndex: 'company_name', key: 'company_name' },
    { title: 'Short Name', dataIndex: 'short_name', key: 'short_name' },
    { title: 'Tax ID (UBN)', dataIndex: 'tax_id', key: 'tax_id', render: (v: string) => v || '-' },
    { title: 'Currency', dataIndex: 'default_currency', key: 'default_currency' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Default',
      dataIndex: 'is_default',
      key: 'is_default',
      render: (v: boolean) => v ? <Tag color="blue">Default</Tag> : null,
    },
    ...(canManage
      ? [{
          title: 'Actions',
          key: 'actions',
          render: (_: unknown, record: Company) => (
            <Button type="link" onClick={() => navigate(`/companies/${record.company_id}/edit`)}>
              Edit
            </Button>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Companies</Title>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/companies/create')}>
            Create Company
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
