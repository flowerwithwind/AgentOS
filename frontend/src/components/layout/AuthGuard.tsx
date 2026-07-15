import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: number;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole !== undefined && user.roleId !== requiredRole) {
    if (user.roleId === 1) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/user/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
