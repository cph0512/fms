import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { Result, Button } from 'antd';

interface Props {
  permission: string;
  children?: React.ReactNode;
}

export function PermissionRoute({ permission, children }: Props) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        }
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
