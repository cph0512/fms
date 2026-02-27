import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Tag, Space, Typography, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../../api/users.api';

const { Title } = Typography;

interface User {
  user_id: string;
  username: string;
  email: string;
  display_name: string;
  status: string;
  last_login_at: string | null;
  roles: { role_id: number; role_name: string }[];
}

export function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchUsers = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await usersApi.list({ page, limit: pageSize, search: search || undefined });
      setUsers(res.data.data);
      setPagination({
        current: res.data.meta.page,
        pageSize: res.data.meta.limit,
        total: res.data.meta.total,
      });
    } catch {
      message.error(t('users.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    { title: t('users.username'), dataIndex: 'username', key: 'username' },
    { title: t('users.name'), dataIndex: 'display_name', key: 'display_name' },
    { title: t('users.email'), dataIndex: 'email', key: 'email' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'ACTIVE' ? 'green' : status === 'LOCKED' ? 'red' : 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: t('users.roles'),
      key: 'roles',
      render: (_: unknown, record: User) =>
        record.roles?.map((r) => <Tag key={r.role_id} color="blue">{r.role_name}</Tag>),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Button type="link" onClick={() => navigate(`/users/${record.user_id}/edit`)}>
          {t('common.edit')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('users.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/users/create')}>
          {t('users.createUser')}
        </Button>
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder={t('users.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => fetchUsers(1)}
          style={{ width: 300 }}
          allowClear
        />
        <Button onClick={() => fetchUsers(1)}>{t('common.search')}</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="user_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => t('common.total', { count: total }),
          onChange: (page, pageSize) => fetchUsers(page, pageSize),
        }}
      />
    </div>
  );
}
