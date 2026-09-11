import { Navigate, Outlet } from "react-router-dom";
import { getStoredAdmin } from "../services/auth.service.js";

export default function RoleRoute({ allowedRoles = [] }) {
  const admin = getStoredAdmin();

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(admin.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
