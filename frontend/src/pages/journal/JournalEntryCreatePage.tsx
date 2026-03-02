import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, DatePicker, Button, Typography, message, Space, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { journalApi } from '../../api/journal.api';
import { accountsApi } from '../../api/accounts.api';

const { Title, Text } = Typography;

export function JournalEntryCreatePage() {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    accountsApi.list({ limit: 500, is_active: 'true' }).then((res) => setAccounts(res.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (values: any) => {
    const lines = values.lines || [];
    const totalDebit = lines.reduce((s: number, l: any) => s + (l.debit_amount || 0), 0);
    const totalCredit = lines.reduce((s: number, l: any) => s + (l.credit_amount || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      message.error(t('journal.unbalancedError'));
      return;
    }
    setLoading(true);
    try {
      await journalApi.createEntry({
        entry_date: values.entry_date.format('YYYY-MM-DD'),
        description: values.description,
        lines: lines.map((l: any) => ({
          account_id: l.account_id,
          debit_amount: l.debit_amount || 0,
          credit_amount: l.credit_amount || 0,
          description: l.description,
        })),
      });
      message.success(t('journal.createSuccess'));
      navigate('/journal/entries');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || t('journal.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const lines = Form.useWatch('lines', form) || [];
  const totalDebit = lines.reduce((s: number, l: any) => s + (l?.debit_amount || 0), 0);
  const totalCredit = lines.reduce((s: number, l: any) => s + (l?.credit_amount || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div>
      <Title level={3}>{t('journal.createEntry')}</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ entry_date: dayjs(), lines: [{ debit_amount: 0, credit_amount: 0 }, { debit_amount: 0, credit_amount: 0 }] }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="entry_date" label={t('journal.entryDate')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="description" label={t('journal.description')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>{t('journal.lines')}</Title>
          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                <table style={{ width: '100%', marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '35%', padding: '8px' }}>{t('journal.account')}</th>
                      <th style={{ width: '20%', padding: '8px' }}>{t('journal.debit')}</th>
                      <th style={{ width: '20%', padding: '8px' }}>{t('journal.credit')}</th>
                      <th style={{ width: '20%', padding: '8px' }}>{t('journal.lineDescription')}</th>
                      <th style={{ width: '5%', padding: '8px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(({ key, name }) => (
                      <tr key={key}>
                        <td style={{ padding: '4px' }}>
                          <Form.Item name={[name, 'account_id']} rules={[{ required: true }]} style={{ margin: 0 }}>
                            <Select showSearch optionFilterProp="label" placeholder={t('journal.selectAccount')} options={accounts.map((a) => ({ value: a.account_id, label: `${a.account_code} ${a.account_name}` }))} />
                          </Form.Item>
                        </td>
                        <td style={{ padding: '4px' }}>
                          <Form.Item name={[name, 'debit_amount']} style={{ margin: 0 }}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </td>
                        <td style={{ padding: '4px' }}>
                          <Form.Item name={[name, 'credit_amount']} style={{ margin: 0 }}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </td>
                        <td style={{ padding: '4px' }}>
                          <Form.Item name={[name, 'description']} style={{ margin: 0 }}>
                            <Input />
                          </Form.Item>
                        </td>
                        <td style={{ padding: '4px' }}>
                          {fields.length > 2 && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{t('journal.total')}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{totalDebit.toLocaleString('zh-TW')}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{totalCredit.toLocaleString('zh-TW')}</td>
                      <td style={{ padding: '8px' }}>
                        <Text type={isBalanced ? 'success' : 'danger'}>{isBalanced ? t('journal.balanced') : t('journal.unbalanced')}</Text>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
                <Button type="dashed" onClick={() => add({ debit_amount: 0, credit_amount: 0 })} icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
                  {t('journal.addLine')}
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} disabled={!isBalanced}>{t('common.create')}</Button>
              <Button onClick={() => navigate('/journal/entries')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
