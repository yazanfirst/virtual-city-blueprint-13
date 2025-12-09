import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireMerchant?: boolean;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireMerchant, requireAdmin }: ProtectedRouteProps) {
  const { user, loading, isMerchant, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center cyber-card max-w-md mx-4">
          <h1 className="font-display text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (requireMerchant && !isMerchant) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center cyber-card max-w-md mx-4">
          <h1 className="font-display text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need a merchant account to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
