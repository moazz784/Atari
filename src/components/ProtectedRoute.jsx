import { Navigate } from "react-router-dom";
import { getToken, getUser } from "../api";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = getToken();
  const user = getUser();

  if (!token) return <Navigate to="/login" replace />;

  
  if (allowedRoles.length && !allowedRoles.includes(user?.role?.toLowerCase())) {
    return <Navigate to="/" replace />;
  }

  return children;
}