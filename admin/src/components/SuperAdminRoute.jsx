import { Navigate, Outlet } from "react-router-dom";
import { getStoredAdmin } from "../services/auth.service.js";

export default function SuperAdminRoute() {
  const admin = getStoredAdmin();

  if (!admin || admin.role !== "SUPER_ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
