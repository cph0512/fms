import { Outlet } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { Result, Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface Props {
  permission: string;
  children?: React.ReactNode;
}

export function PermissionRoute({ permission, children }: Props) {
  const hasPermission = usePermission(permission);
  const { t } = useTranslation();

  if (!hasPermission) {
    return (
      <Result
        status="403"
        title={t('permission.forbiddenTitle')}
        subTitle={t('permission.forbiddenMessage')}
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            {t('permission.goBack')}
          </Button>
        }
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
