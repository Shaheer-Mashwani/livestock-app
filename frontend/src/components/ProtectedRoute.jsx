import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// allowedRoles is optional — if not given, any logged-in user can access
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Wait until we've checked localStorage before deciding
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  // Not logged in at all → go to login page
  if (!user) return <Navigate to="/login" replace />;

  // Logged in, but role not allowed for this page → go to dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // All good → show the page
  return children;
};

export default ProtectedRoute;
