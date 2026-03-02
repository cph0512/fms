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
import { InboxOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { deliveryTripsApi } from '../../api/delivery-trips.api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface SheetPreview {
  sheet_name: string;
  customer_name: string;
  date_range: { from: string; to: string };
  trip_count: number;
  total_amount: number;
}

interface NewRoute {
  route_name: string;
  content_type: string;
  customer_name: string;
  standard_price: number;
}

interface PreviewResult {
  import_id: string;
  sheets: SheetPreview[];
  new_routes: NewRoute[];
  total_trips: number;
  total_amount: number;
}

interface ImportResult {
  success_count: number;
  total_amount: number;
  new_routes_created: number;
}

export function TripImportPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const formatAmount = (val: number | string) =>
    Number(val).toLocaleString('zh-TW');

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await deliveryTripsApi.importPreview(file);
      setPreview(res.data.data);
      setCurrentStep(1);
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('delivery.importPreviewFailed'));
    } finally {
      setUploading(false);
    }
    return false; // prevent auto upload
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setConfirming(true);
    try {
      const res = await deliveryTripsApi.importConfirm({ import_id: preview.import_id });
      setResult(res.data.data);
      setCurrentStep(2);
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('delivery.importFailed'));
    } finally {
      setConfirming(false);
    }
  };

  const sheetColumns = [
    {
      title: t('delivery.sheetName'),
      dataIndex: 'sheet_name',
      key: 'sheet_name',
    },
    {
      title: t('delivery.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: t('delivery.dateRange'),
      key: 'date_range',
      render: (_: unknown, record: SheetPreview) =>
        `${record.date_range.from} ~ ${record.date_range.to}`,
    },
    {
      title: t('delivery.tripCount'),
      dataIndex: 'trip_count',
      key: 'trip_count',
      align: 'center' as const,
    },
    {
      title: t('delivery.totalAmount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right' as const,
      render: (v: number) => `$${formatAmount(v)}`,
    },
  ];

  const newRouteColumns = [
    {
      title: t('delivery.routeName'),
      dataIndex: 'route_name',
      key: 'route_name',
    },
    {
      title: t('delivery.contentType'),
      dataIndex: 'content_type',
      key: 'content_type',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: t('delivery.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: t('delivery.standardPrice'),
      dataIndex: 'standard_price',
      key: 'standard_price',
      align: 'right' as const,
      render: (v: number) => `$${formatAmount(v)}`,
    },
  ];

  return (
    <div>
      <Title level={3}>{t('delivery.importTrips')}</Title>

      <Steps
        current={currentStep}
        style={{ marginBottom: 24, maxWidth: 600 }}
        items={[
          { title: t('delivery.importStep1') },
          { title: t('delivery.importStep2') },
          { title: t('delivery.importStep3') },
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
            <p className="ant-upload-text">{t('delivery.uploadDragText')}</p>
            <p className="ant-upload-hint">{t('delivery.uploadHintText')}</p>
          </Dragger>
          {uploading && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text type="secondary">{t('delivery.uploadingAndParsing')}</Text>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Preview */}
      {currentStep === 1 && preview && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={24}>
              <Col xs={12} sm={8}>
                <Statistic
                  title={t('delivery.sheetCount')}
                  value={preview.sheets.length}
                  suffix={t('delivery.sheetUnit')}
                />
              </Col>
              <Col xs={12} sm={8}>
                <Statistic
                  title={t('delivery.totalTrips')}
                  value={preview.total_trips}
                  suffix={t('delivery.tripUnit')}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title={t('delivery.totalAmount')}
                  value={formatAmount(preview.total_amount)}
                  prefix="$"
                />
              </Col>
            </Row>
          </Card>

          <Card title={t('delivery.sheetSummary')} style={{ marginBottom: 16 }}>
            <Table
              columns={sheetColumns}
              dataSource={preview.sheets}
              rowKey="sheet_name"
              pagination={false}
              size="small"
            />
          </Card>

          {preview.new_routes.length > 0 && (
            <Card title={t('delivery.newRoutesToCreate')} style={{ marginBottom: 16 }}>
              <Text type="warning" style={{ display: 'block', marginBottom: 12 }}>
                {t('delivery.newRoutesNotice', { count: preview.new_routes.length })}
              </Text>
              <Table
                columns={newRouteColumns}
                dataSource={preview.new_routes}
                rowKey="route_name"
                pagination={false}
                size="small"
              />
            </Card>
          )}

          <Divider />
          <Space>
            <Button
              type="primary"
              size="large"
              loading={confirming}
              onClick={handleConfirmImport}
            >
              {t('delivery.confirmImport')}
            </Button>
            <Button size="large" onClick={() => { setCurrentStep(0); setPreview(null); }}>
              {t('delivery.reUpload')}
            </Button>
            <Button size="large" onClick={() => navigate('/delivery-trips')}>
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
            <Title level={4}>{t('delivery.importComplete')}</Title>
            <Row gutter={24} justify="center" style={{ marginTop: 24 }}>
              <Col>
                <Statistic
                  title={t('delivery.importedTrips')}
                  value={result.success_count}
                  suffix={t('delivery.tripUnit')}
                />
              </Col>
              <Col>
                <Statistic
                  title={t('delivery.totalAmount')}
                  value={formatAmount(result.total_amount)}
                  prefix="$"
                />
              </Col>
              {result.new_routes_created > 0 && (
                <Col>
                  <Statistic
                    title={t('delivery.newRoutesCreated')}
                    value={result.new_routes_created}
                    suffix={t('delivery.routeCountUnit')}
                  />
                </Col>
              )}
            </Row>
            <Divider />
            <Space>
              <Button type="primary" onClick={() => navigate('/delivery-trips')}>
                {t('delivery.viewTrips')}
              </Button>
              <Button onClick={() => { setCurrentStep(0); setPreview(null); setResult(null); }}>
                {t('delivery.importAnother')}
              </Button>
            </Space>
          </div>
        </Card>
      )}
    </div>
  );
}
