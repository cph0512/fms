import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Steps,
  Upload,
  Button,
  Table,
  Typography,
  message,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Divider,
} from 'antd';
import { InboxOutlined, CheckCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { accountsApi } from '../../api/accounts.api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface PreviewRow {
  account_code: string;
  account_name: string;
  account_type: string;
  parent_code: string;
  description: string;
  parent_matched: boolean;
  exists: boolean;
}

interface PreviewResult {
  accounts: PreviewRow[];
  total: number;
  new_count: number;
  update_count: number;
}

interface ImportResult {
  created: number;
  updated: number;
  total: number;
}

export function AccountImportPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await accountsApi.importPreview(file);
      setPreview(res.data.data);
      setCurrentStep(1);
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('accounts.importFailed'));
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setConfirming(true);
    try {
      const confirmData = {
        accounts: preview.accounts.map((a) => ({
          account_code: a.account_code,
          account_name: a.account_name,
          account_type: a.account_type,
          parent_code: a.parent_code || undefined,
          description: a.description || undefined,
        })),
      };
      const res = await accountsApi.importConfirm(confirmData);
      setResult(res.data.data);
      setCurrentStep(2);
      message.success(t('accounts.importSuccess'));
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('accounts.importFailed'));
    } finally {
      setConfirming(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/templates/accounts-template.xlsx', '_blank');
  };

  const columns = [
    {
      title: t('accounts.accountCode'),
      dataIndex: 'account_code',
      key: 'account_code',
      width: 120,
    },
    {
      title: t('accounts.accountName'),
      dataIndex: 'account_name',
      key: 'account_name',
    },
    {
      title: t('accounts.accountType'),
      dataIndex: 'account_type',
      key: 'account_type',
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          ASSET: 'blue',
          LIABILITY: 'red',
          EQUITY: 'green',
          REVENUE: 'orange',
          EXPENSE: 'purple',
        };
        return <Tag color={colorMap[type] || 'default'}>{t(`accounts.type_${type}`)}</Tag>;
      },
    },
    {
      title: t('accounts.parentCode'),
      dataIndex: 'parent_code',
      key: 'parent_code',
      width: 130,
      render: (code: string, record: PreviewRow) => {
        if (!code) return '-';
        return (
          <span>
            {code}
            {record.parent_matched ? (
              <Tag color="green" style={{ marginLeft: 4 }}>{t('delivery.importMatched')}</Tag>
            ) : (
              <Tag color="red" style={{ marginLeft: 4 }}>{t('accounts.parentNotFound')}</Tag>
            )}
          </span>
        );
      },
    },
    {
      title: t('accounts.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('accounts.importStatus'),
      key: 'status',
      width: 100,
      render: (_: unknown, record: PreviewRow) => {
        if (!record.parent_matched && record.parent_code) {
          return <Tag color="red">{t('accounts.statusError')}</Tag>;
        }
        return record.exists ? (
          <Tag color="orange">{t('accounts.statusUpdate')}</Tag>
        ) : (
          <Tag color="green">{t('accounts.statusNew')}</Tag>
        );
      },
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>{t('accounts.importTitle')}</Title>
        <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
          {t('accounts.downloadTemplate')}
        </Button>
      </Space>

      <Steps
        current={currentStep}
        style={{ marginBottom: 24, maxWidth: 600 }}
        items={[
          { title: t('accounts.uploadExcel') },
          { title: t('accounts.importPreview') },
          { title: t('accounts.importResult') },
        ]}
      />

      {/* Step 1: Upload */}
      {currentStep === 0 && (
        <Card style={{ maxWidth: 600 }}>
          <Dragger
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => {
              handleUpload(file);
              return false;
            }}
            disabled={uploading}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">{t('accounts.uploadExcel')}</p>
            <p className="ant-upload-hint">{t('accounts.uploadHint')}</p>
          </Dragger>
          {uploading && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text type="secondary">{t('common.loading')}</Text>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Preview */}
      {currentStep === 1 && preview && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={24}>
              <Col xs={8}>
                <Statistic title={t('accounts.totalAccounts')} value={preview.total} />
              </Col>
              <Col xs={8}>
                <Statistic title={t('accounts.newAccounts')} value={preview.new_count} />
              </Col>
              <Col xs={8}>
                <Statistic title={t('accounts.updateAccounts')} value={preview.update_count} />
              </Col>
            </Row>
          </Card>

          <Card title={t('accounts.importPreview')} style={{ marginBottom: 16 }}>
            <Table
              columns={columns}
              dataSource={preview.accounts}
              rowKey="account_code"
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          </Card>

          <Divider />
          <Space>
            <Button
              type="primary"
              size="large"
              loading={confirming}
              onClick={handleConfirmImport}
            >
              {t('accounts.confirmImport')}
            </Button>
            <Button size="large" onClick={() => { setCurrentStep(0); setPreview(null); }}>
              {t('accounts.reUpload')}
            </Button>
            <Button size="large" onClick={() => navigate('/accounts')}>
              {t('common.cancel')}
            </Button>
          </Space>
        </div>
      )}

      {/* Step 3: Result */}
      {currentStep === 2 && result && (
        <Card>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4}>{t('accounts.importSuccess')}</Title>
            <Row gutter={24} justify="center" style={{ marginTop: 24 }}>
              <Col>
                <Statistic title={t('accounts.accountsImported')} value={result.total} />
              </Col>
              <Col>
                <Statistic title={t('accounts.newAccounts')} value={result.created} />
              </Col>
              <Col>
                <Statistic title={t('accounts.updateAccounts')} value={result.updated} />
              </Col>
            </Row>
            <Divider />
            <Space>
              <Button type="primary" onClick={() => navigate('/accounts')}>
                {t('accounts.title')}
              </Button>
              <Button onClick={() => { setCurrentStep(0); setPreview(null); setResult(null); }}>
                {t('accounts.importAnother')}
              </Button>
            </Space>
          </div>
        </Card>
      )}
    </div>
  );
}
